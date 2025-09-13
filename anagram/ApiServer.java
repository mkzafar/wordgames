import com.sun.net.httpserver.*;
import java.io.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

public class ApiServer {
  private static Set<String> dictionary = new HashSet<>();

  public static void main(String[] args) throws Exception {
    // 1) Load dictionary
    try (BufferedReader br = new BufferedReader(new FileReader("dictionary.txt"))) {
      String line;
      while ((line = br.readLine()) != null) dictionary.add(line.toLowerCase());
    }

    // 2) Start HTTP server on 8081
    HttpServer server = HttpServer.create(new InetSocketAddress(8081), 0);

    // GET /anagrams?input=letters&min=3&max=6
    server.createContext("/anagrams", exchange -> {
      try {
        addCors(exchange);
        if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
          exchange.sendResponseHeaders(405, -1);
          return;
        }

        Map<String,String> q = query(exchange.getRequestURI().getRawQuery());
        String input = Optional.ofNullable(q.get("input")).orElse("").toLowerCase();
        int min = Integer.parseInt(q.getOrDefault("min", "3"));
        int max = Integer.parseInt(q.getOrDefault("max", String.valueOf(input.length())));

        List<String> results = new ArrayList<>();
        for (int len = Math.max(3, min); len <= Math.min(max, input.length()); len++) {
          generateWords(input, len, results);
        }
        List<String> words = results.stream()
          .filter(dictionary::contains)
          .distinct()
          .sorted()
          .collect(Collectors.toList());

        byte[] body = ("{\"words\":" + toJsonArray(words) + "}").getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().add("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(200, body.length);
        try (OutputStream os = exchange.getResponseBody()) { os.write(body); }
      } catch (Exception e) {
        byte[] body = ("{\"error\":\"" + e.getMessage() + "\"}").getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().add("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(500, body.length);
        try (OutputStream os = exchange.getResponseBody()) { os.write(body); }
      }
    });

    // POST /filter   (body: text/plain, newline-separated words) -> {"valid":[...]}
    server.createContext("/filter", exchange -> {
      try {
        addCors(exchange);
        String method = exchange.getRequestMethod();
        if ("OPTIONS".equalsIgnoreCase(method)) { exchange.sendResponseHeaders(204, -1); return; }
        if (!"POST".equalsIgnoreCase(method)) { exchange.sendResponseHeaders(405, -1); return; }

        String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        List<String> valid = new ArrayList<>();
        for (String line : body.split("\\R+")) {
          String w = line.trim().toLowerCase();
          if (!w.isEmpty() && dictionary.contains(w)) valid.add(w);
        }

        String json = "{\"valid\":" + toJsonArray(valid) + "}";
        exchange.getResponseHeaders().add("Content-Type", "application/json; charset=UTF-8");
        byte[] resp = json.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(200, resp.length);
        try (OutputStream os = exchange.getResponseBody()) { os.write(resp); }
      } catch (Exception e) {
        byte[] resp = ("{\"error\":\"" + e.getMessage() + "\"}").getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().add("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(500, resp.length);
        try (OutputStream os = exchange.getResponseBody()) { os.write(resp); }
      }
    });

    // Preflight helper (optional)
    server.createContext("/_cors", exchange -> {
      addCors(exchange);
      exchange.sendResponseHeaders(204, -1);
    });

    server.start();
    System.out.println("API on http://localhost:8081");
  }

  private static void addCors(HttpExchange ex) {
    var h = ex.getResponseHeaders();
    h.add("Access-Control-Allow-Origin", "*");
    h.add("Access-Control-Allow-Headers", "Content-Type");
    h.add("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  }

  private static Map<String,String> query(String raw) {
    Map<String,String> m = new HashMap<>();
    if (raw == null) return m;
    for (String p : raw.split("&")) {
      int i = p.indexOf('=');
      if (i >= 0) m.put(urlDecode(p.substring(0,i)), urlDecode(p.substring(i+1)));
    }
    return m;
  }

  private static String urlDecode(String s){
    try { return java.net.URLDecoder.decode(s, "UTF-8"); }
    catch(Exception e){ return s; }
  }

  // generate permutations of a given length from input
  private static void generateWords(String input, int length, List<String> out) {
    generateWordsHelper(input, "", length, out);
  }

  private static void generateWordsHelper(String input, String prefix, int length, List<String> out) {
    if (prefix.length() == length) {
      out.add(prefix);
    } else {
      for (int i = 0; i < input.length(); i++) {
        generateWordsHelper(input.substring(0, i) + input.substring(i + 1), prefix + input.charAt(i), length, out);
      }
    }
  }

  private static String toJsonArray(List<String> items) {
    return items.stream()
      .map(s -> "\"" + s.replace("\"","\\\"") + "\"")
      .collect(Collectors.joining(",", "[", "]"));
  }
}
