import com.sun.net.httpserver.HttpServer;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.time.*;
import java.util.*;
import java.util.concurrent.Executors;

/** Java 17: UTF-8 site generator and self-contained preview server. No dependencies. */
public final class Anniversary {
    private static final java.nio.charset.Charset UTF8 = StandardCharsets.UTF_8;
    public static void main(String[] args) throws Exception {
        String command = args.length == 0 ? "serve" : args[0];
        if (command.equals("build")) { build(Path.of(args.length > 1 ? args[1] : ".").toAbsolutePath().normalize()); return; }
        if (!command.equals("serve")) throw new IllegalArgumentException("Use: build [project-directory] | serve [port]");
        int port = args.length > 1 ? Integer.parseInt(args[1]) : 8080;
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", port), 0);
        server.createContext("/", exchange -> {
            try {
                if (!Set.of("GET", "HEAD").contains(exchange.getRequestMethod())) {
                    exchange.getResponseHeaders().set("Allow", "GET, HEAD"); exchange.sendResponseHeaders(405, -1); return;
                }
                String name = exchange.getRequestURI().getPath();
                if (name.equals("/")) name = "/index.html";
                if (name.contains("..") || name.contains("\\") || name.indexOf('\0') >= 0) { exchange.sendResponseHeaders(400, -1); return; }
                byte[] bytes;
                try (InputStream in = Anniversary.class.getResourceAsStream("/site" + name)) {
                    if (in != null) bytes = in.readAllBytes();
                    else {
                        Path root = Path.of("dist").toAbsolutePath().normalize();
                        Path file = root.resolve(name.substring(1)).normalize();
                        if (!file.startsWith(root) || !Files.isRegularFile(file)) { exchange.sendResponseHeaders(404, -1); return; }
                        bytes = Files.readAllBytes(file);
                    }
                }
                exchange.getResponseHeaders().set("Content-Type", mime(name));
                exchange.getResponseHeaders().set("X-Content-Type-Options", "nosniff");
                exchange.getResponseHeaders().set("Cache-Control", "no-cache");
                if (exchange.getRequestMethod().equals("HEAD")) { exchange.getResponseHeaders().set("Content-Length", Integer.toString(bytes.length)); exchange.sendResponseHeaders(200, -1); }
                else { exchange.sendResponseHeaders(200, bytes.length); exchange.getResponseBody().write(bytes); }
            } catch (Exception e) { System.err.println("Request failed: " + e.getClass().getSimpleName()); }
            finally { exchange.close(); }
        });
        server.setExecutor(Executors.newFixedThreadPool(6)); server.start();
        Runtime.getRuntime().addShutdownHook(new Thread(() -> server.stop(0)));
        System.out.println("Gui Mox, mot chut thuong: http://localhost:" + port);
    }
    private static void build(Path root) throws Exception {
        Properties p = new Properties();
        try (Reader reader = Files.newBufferedReader(root.resolve("config/anniversary.properties"), UTF8)) { p.load(reader); }
        LocalDate start = LocalDate.parse(p.getProperty("startDate"));
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        long remaining = java.time.temporal.ChronoUnit.DAYS.between(today, start.plusYears(2));
        String anniversaryStatus = remaining > 0 ? "Còn " + remaining + " ngày đến " + display(start.plusYears(2)) + "."
            : remaining == 0 ? "Hôm nay, mình tròn hai năm." : "Mốc hai năm của mình · " + display(start.plusYears(2)) + ".";
        Path output = root.resolve("dist"); Files.createDirectories(output);
        createPhotoPreviews(root, output);
        try (var files = Files.walk(root.resolve("web"))) {
            for (Path source : files.filter(Files::isRegularFile).toList()) {
                Path relative = root.resolve("web").relativize(source), target = output.resolve(relative);
                Files.createDirectories(target.getParent());
                if (!source.toString().endsWith(".html")) Files.copy(source, target, StandardCopyOption.REPLACE_EXISTING);
                else {
                    String html = Files.readString(source, UTF8);
                    Path content = root.resolve("content");
                    if (Files.isDirectory(content)) {
                        try (var parts = Files.list(content)) {
                            for (Path part : parts.filter(f -> f.toString().endsWith(".html")).toList()) {
                                String key = part.getFileName().toString().replaceFirst("\\.html$", "");
                                html = html.replace("{{" + key + "}}", Files.readString(part, UTF8));
                            }
                        }
                    }
                    for (String key : p.stringPropertyNames()) html = html.replace("{{" + key + "}}", escape(p.getProperty(key)));
                    html = html.replace("{{anniversaryDate}}", start.plusYears(2).toString())
                        .replace("{{anniversaryDays}}", Long.toString(java.time.temporal.ChronoUnit.DAYS.between(start, start.plusYears(2))))
                        .replace("{{elapsedDays}}", Long.toString(Math.max(0, java.time.temporal.ChronoUnit.DAYS.between(start, today))))
                        .replace("{{todayDisplay}}", display(today)).replace("{{anniversaryStatus}}", anniversaryStatus)
                        .replace("{{startDisplay}}", display(start)).replace("{{firstDisplay}}", display(start.plusYears(1)))
                        .replace("{{secondDisplay}}", display(start.plusYears(2))).replace("{{photos}}", gallery(root))
                        .replace("{{featuredPhotos}}", featuredGallery(root))
                        .replace("{{photoCount}}", Integer.toString(memoryChapters(root).stream().mapToInt(c -> c.photos().size()).sum()))
                        .replace("{{journeyTimeline}}", journeyTimeline(root)).replace("{{eventOptions}}", eventOptions(root));
                    if (html.contains("{{")) throw new IllegalStateException("Unresolved template field: " + relative);
                    Files.writeString(target, html, UTF8);
                }
            }
        }
        System.out.println("Built Java site: " + output);
    }

    private record MemoryPhoto(String file, String caption, String category, LocalDate date, String event) {}
    private record MemoryChapter(String id, String place, String title, String note, List<MemoryPhoto> photos) {
        LocalDate firstDate() { return photos.stream().map(MemoryPhoto::date).filter(Objects::nonNull).min(LocalDate::compareTo).orElse(null); }
        LocalDate lastDate() { return photos.stream().map(MemoryPhoto::date).filter(Objects::nonNull).max(LocalDate::compareTo).orElse(null); }
        String dateLabel() {
            LocalDate first = firstDate(), last = lastDate();
            return first == null ? "ẢNH CHƯA GHI NGÀY" : first.equals(last) ? display(first) : display(first) + " — " + display(last);
        }
    }
    private static List<MemoryChapter> memoryChapters(Path root) throws IOException {
        Map<String, String[]> events = new LinkedHashMap<>();
        for (String row : Files.readAllLines(root.resolve("config/events.tsv"), UTF8)) {
            if (row.isBlank() || row.startsWith("#")) continue;
            String[] fields = row.split("\t", -1);
            if (fields.length == 3) fields = new String[] {fields[0], fields[1], fields[2], ""};
            if (fields.length != 4 || !fields[0].matches("[a-z0-9-]+") || events.putIfAbsent(fields[0], fields) != null)
                throw new IllegalArgumentException("Invalid or duplicate event: " + row);
        }
        Map<String, List<MemoryPhoto>> photos = new LinkedHashMap<>();
        Set<String> filenames = new HashSet<>();
        for (String row : Files.readAllLines(root.resolve("config/photos.tsv"), UTF8)) {
            if (row.isBlank() || row.startsWith("#")) continue;
            String[] fields = row.split("\t", -1);
            if ((fields.length != 3 && fields.length != 5) || !Set.of("couple", "family", "pet", "portrait").contains(fields[2]))
                throw new IllegalArgumentException("Invalid photo row: " + row);
            String event = fields.length == 5 ? fields[4] : "everyday";
            if (!events.containsKey(event)) throw new IllegalArgumentException("Unknown photo event: " + event);
            if (!filenames.add(fields[0])) throw new IllegalArgumentException("Duplicate photo: " + fields[0]);
            photoPath(root, fields[0]);
            LocalDate date = fields.length == 5 && !fields[3].isBlank() ? LocalDate.parse(fields[3]) : null;
            photos.computeIfAbsent(event, ignored -> new ArrayList<>()).add(new MemoryPhoto(fields[0], fields[1], fields[2], date, event));
        }
        List<MemoryChapter> chapters = new ArrayList<>();
        for (var entry : events.entrySet()) {
            List<MemoryPhoto> group = photos.getOrDefault(entry.getKey(), List.of());
            if (group.isEmpty()) continue;
            group.sort(Comparator.comparing(MemoryPhoto::date, Comparator.nullsLast(Comparator.naturalOrder())));
            String[] fields = entry.getValue();
            chapters.add(new MemoryChapter(fields[0], fields[1], fields[2], fields[3], group));
        }
        chapters.sort(Comparator.comparing(MemoryChapter::firstDate, Comparator.nullsLast(Comparator.naturalOrder())));
        return chapters;
    }
    private static Path photoPath(Path root, String filename) {
        Path folder = root.resolve("web/assets/photos").normalize(), image = folder.resolve(filename).normalize();
        if (!image.startsWith(folder) || !Files.isRegularFile(image)) throw new IllegalArgumentException("Missing photo: " + filename);
        return image;
    }
    private static String photoUrl(String filename) { return "assets/photos/" + URLEncoder.encode(filename, UTF8).replace("+", "%20"); }
    private static String previewUrl(String filename) { return "assets/photos/previews/" + URLEncoder.encode(filename, UTF8).replace("+", "%20"); }
    private static void createPhotoPreviews(Path root, Path output) throws IOException {
        Path previewFolder = output.resolve("assets/photos/previews");
        Files.createDirectories(previewFolder);
        for (MemoryChapter chapter : memoryChapters(root)) for (MemoryPhoto photo : chapter.photos()) {
            var original = javax.imageio.ImageIO.read(photoPath(root, photo.file()).toFile());
            if (original == null) throw new IllegalArgumentException("Unsupported image: " + photo.file());
            double ratio = Math.min(1.0, Math.min(720.0 / original.getWidth(), 960.0 / original.getHeight()));
            int width = Math.max(1, (int) Math.round(original.getWidth() * ratio));
            int height = Math.max(1, (int) Math.round(original.getHeight() * ratio));
            var preview = new java.awt.image.BufferedImage(width, height, java.awt.image.BufferedImage.TYPE_INT_RGB);
            var graphics = preview.createGraphics();
            graphics.setRenderingHint(java.awt.RenderingHints.KEY_INTERPOLATION, java.awt.RenderingHints.VALUE_INTERPOLATION_BICUBIC);
            graphics.drawImage(original, 0, 0, width, height, null); graphics.dispose();
            var writer = javax.imageio.ImageIO.getImageWritersByFormatName("jpeg").next();
            try (var stream = javax.imageio.ImageIO.createImageOutputStream(previewFolder.resolve(photo.file()).toFile())) {
                writer.setOutput(stream);
                var parameters = writer.getDefaultWriteParam();
                parameters.setCompressionMode(javax.imageio.ImageWriteParam.MODE_EXPLICIT); parameters.setCompressionQuality(.82f);
                writer.write(null, new javax.imageio.IIOImage(preview, null, null), parameters);
            } finally { writer.dispose(); }
        }
    }
    private static String photoCard(Path root, MemoryPhoto photo, MemoryChapter chapter, String id) throws IOException {
        var dimensions = javax.imageio.ImageIO.read(photoPath(root, photo.file()).toFile());
        if (dimensions == null) throw new IllegalArgumentException("Unsupported image: " + photo.file());
        String date = photo.date() == null ? "" : display(photo.date());
        String caption = photo.caption() + " · " + chapter.place() + (date.isBlank() ? "" : " · " + date);
        return "<button type=\"button\" class=\"photo-card\"" + (id.isBlank() ? "" : " id=\"" + id + "\"")
            + " data-event=\"" + chapter.id() + "\" data-photo=\"" + photoUrl(photo.file()) + "\" data-caption=\"" + escape(caption)
            + "\" aria-haspopup=\"dialog\" aria-label=\"Xem ảnh: " + escape(caption) + "\"><span class=\"photo-image\"><img loading=\"lazy\" decoding=\"async\" src=\""
            + previewUrl(photo.file()) + "\" width=\"" + dimensions.getWidth() + "\" height=\"" + dimensions.getHeight() + "\" alt=\""
            + escape(photo.caption() + " · " + chapter.place()) + "\"></span><span class=\"photo-meta\"><span>" + escape(chapter.place()) + "</span>"
            + (photo.date() == null ? "" : "<time datetime=\"" + photo.date() + "\">" + date + "</time>")
            + "</span><span class=\"photo-caption\">" + escape(photo.caption()) + "</span></button>";
    }
    private static String featuredGallery(Path root) throws IOException {
        Set<String> featured = new LinkedHashSet<>();
        for (String line : Files.readAllLines(root.resolve("config/featured.txt"), UTF8)) {
            if (line.isBlank() || line.startsWith("#")) continue;
            if (!featured.add(line.strip())) throw new IllegalArgumentException("Duplicate featured photo: " + line);
        }
        if (featured.size() < 10 || featured.size() > 15) throw new IllegalArgumentException("Select 10–15 featured photos.");
        StringBuilder html = new StringBuilder();
        Set<String> found = new HashSet<>();
        for (MemoryChapter chapter : memoryChapters(root)) {
            boolean first = true;
            for (MemoryPhoto photo : chapter.photos()) if (featured.contains(photo.file())) {
                found.add(photo.file());
                html.append(photoCard(root, photo, chapter, first ? "memory-" + chapter.id() : "")); first = false;
            }
        }
        if (!found.equals(featured)) throw new IllegalArgumentException("Featured photo missing from photos.tsv.");
        return html.toString();
    }
    private static String journeyTimeline(Path root) throws IOException {
        StringBuilder html = new StringBuilder("<ol class=\"journey-timeline\" aria-label=\"Dòng thời gian kỷ niệm\">");
        for (MemoryChapter chapter : memoryChapters(root)) {
            html.append("<li><a href=\"#memory-").append(chapter.id()).append("\"><span class=\"timeline-dot\" aria-hidden=\"true\"></span><small>")
                .append(escape(chapter.dateLabel())).append("</small><span>").append(escape(chapter.place())).append("</span></a></li>");
        }
        return html.append("</ol>").toString();
    }
    private static String eventOptions(Path root) throws IOException {
        StringBuilder html = new StringBuilder("<option value=\"all\">Tất cả các mục</option>");
        for (MemoryChapter chapter : memoryChapters(root)) html.append("<option value=\"").append(chapter.id()).append("\">")
            .append(escape(chapter.place())).append(chapter.firstDate() == null ? "" : " · " + chapter.firstDate().getYear()).append("</option>");
        return html.toString();
    }
    private static String gallery(Path root) throws IOException {
        StringBuilder html = new StringBuilder();
        for (MemoryChapter chapter : memoryChapters(root)) {
            html.append("<article class=\"memory-chapter\" id=\"album-memory-").append(chapter.id()).append("\" data-event=\"").append(chapter.id())
                .append("\" aria-labelledby=\"chapter-title-").append(chapter.id()).append("\"><header class=\"chapter-heading\"><h3 id=\"chapter-title-")
                .append(chapter.id()).append("\">").append(escape(chapter.place())).append("</h3><span class=\"chapter-date\">").append(escape(chapter.dateLabel()))
                .append("</span></header><div class=\"chapter-photos\">");
            for (MemoryPhoto photo : chapter.photos()) {
                html.append(photoCard(root, photo, chapter, ""));
            }
            html.append("</div></article>");
        }
        return html.toString();
    }
    private static String display(LocalDate d) { return String.format("%02d.%02d.%04d", d.getDayOfMonth(), d.getMonthValue(), d.getYear()); }
    private static String escape(String s) { return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;").replace("'", "&#39;"); }
    private static String mime(String n) {
        String lower = n.toLowerCase(Locale.ROOT);
        if(lower.endsWith(".html"))return "text/html; charset=utf-8";
        if(lower.endsWith(".css"))return "text/css; charset=utf-8";
        if(lower.endsWith(".js"))return "text/javascript; charset=utf-8";
        if(lower.endsWith(".svg"))return "image/svg+xml";
        if(lower.endsWith(".png"))return "image/png";
        if(lower.endsWith(".jpg")||lower.endsWith(".jpeg"))return "image/jpeg";
        if(lower.endsWith(".webp"))return "image/webp";
        if(lower.endsWith(".m4a"))return "audio/mp4";
        return "application/octet-stream";
    }
}
