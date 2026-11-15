import 'package:material_ui/material_ui.dart';

// Same colors as the web app so both clients look like one product.
const brand = Color(0xFF1E3A8A);
const brandLight = Color(0xFFE8EDF9);
const accent = Color(0xFFF59E0B);
const mentorBrown = Color(0xFF92400E);
const pageBackground = Color(0xFFF4F6FB);

ThemeData buildTheme() {
  final scheme = ColorScheme.fromSeed(seedColor: brand, primary: brand, secondary: accent);
  return ThemeData(
    colorScheme: scheme,
    scaffoldBackgroundColor: pageBackground,
    appBarTheme: const AppBarTheme(backgroundColor: brand, foregroundColor: Colors.white),
    cardTheme: CardThemeData(
      color: Colors.white,
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: brand,
        minimumSize: const Size.fromHeight(48),
        textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
      ),
    ),
  );
}
