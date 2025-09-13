import java.util.*;
import java.io.*;

public class AnagramsGame {

    private static Set<String> dictionary;

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        System.out.print("Enter the length of the input string (3-15): ");
        int n = scanner.nextInt();
        scanner.nextLine(); // consume newline

        System.out.print("Enter the input characters (letters only): ");
        String input = scanner.nextLine().toLowerCase();
        if (input.length() != n || !input.matches("[a-z]+")) {
            System.out.println("Invalid input. Please try again.");
            return;
        }

        loadDictionary("dictionary.txt");

        for (int i = 3; i <= n; i++) {
            List<String> words = generateWords(input, i);
            System.out.printf("%d-letter words:%n", i);
            for (String word : words) {
                if (dictionary.contains(word)) {
                    System.out.println(word);
                }
            }
            System.out.println();
        }
    }

    private static void loadDictionary(String filename) {
        dictionary = new HashSet<>();
        try (BufferedReader reader = new BufferedReader(new FileReader(filename))) {
            String line;
            while ((line = reader.readLine()) != null) {
                dictionary.add(line.toLowerCase());
            }
        } catch (IOException e) {
            System.err.println("Error loading dictionary: " + e.getMessage());
        }
    }

    private static List<String> generateWords(String input, int length) {
        List<String> words = new ArrayList<>();
        generateWordsHelper(input, "", length, words);
        return words;
    }

    private static void generateWordsHelper(String input, String prefix, int length, List<String> words) {
        if (prefix.length() == length) {
            words.add(prefix);
        } else {
            for (int i = 0; i < input.length(); i++) {
                generateWordsHelper(input.substring(0, i) + input.substring(i + 1), prefix + input.charAt(i), length, words);
            }
        }
    }
}