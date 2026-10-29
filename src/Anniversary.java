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
        Path output = root.resolve("dist"); Files.createDirectories(output);
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
                        .replace("{{startDisplay}}", display(start)).replace("{{firstDisplay}}", display(start.plusYears(1)))
                        .replace("{{secondDisplay}}", display(start.plusYears(2))).replace("{{photos}}", gallery(root));
                    if (html.contains("{{")) throw new IllegalStateException("Unresolved template field: " + relative);
                    Files.writeString(target, html, UTF8);
                }
            }
        }
        System.out.println("Built Java site: " + output);
    }
    private static String gallery(Path root) throws IOException {
        StringBuilder cards = new StringBuilder(); int count = 0;
        for (String row : Files.readAllLines(root.resolve("config/photos.tsv"), UTF8)) {
            if (row.isBlank() || row.startsWith("#")) continue;
            String[] values = row.split("\t", -1);
            if (values.length != 3 || !Set.of("couple", "family", "pet").contains(values[2])) throw new IllegalArgumentException("Invalid photo row: " + row);
            Path folder = root.resolve("web/assets/photos").normalize(), image = folder.resolve(values[0]).normalize();
            if (!image.startsWith(folder) || !Files.isRegularFile(image)) throw new IllegalArgumentException("Missing photo: " + values[0]);
            String url = "assets/photos/" + URLEncoder.encode(values[0], UTF8).replace("+", "%20");
            count++;
            cards.append("<button class=\"photo-card\" data-category=\"").append(values[2]).append("\" data-photo=\"").append(url).append("\"><img loading=\"lazy\" src=\"").append(url).append("\" alt=\"").append(escape(values[1])).append("\"><span>").append(escape(values[1])).append("</span></button>");
        }
        return count == 0 ? "<p class=\"filter-empty\">Chỗ này để cất những tấm ảnh của tụi mình. ♡</p>" : cards.toString();
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
        return "application/octet-stream";
    }
}
