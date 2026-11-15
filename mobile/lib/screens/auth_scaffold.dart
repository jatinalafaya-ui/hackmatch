import 'package:material_ui/material_ui.dart';

import '../theme.dart';

class AuthScaffold extends StatelessWidget {
  final String title;
  final String? subtitle;
  final List<Widget> children;

  const AuthScaffold({super.key, required this.title, this.subtitle, required this.children});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: brand,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Row(
                      children: [
                        _LogoMark(),
                        SizedBox(width: 8),
                        Text('HackMatch', style: TextStyle(color: brand, fontSize: 22, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const SizedBox(height: 20),
                    Text(title, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                    if (subtitle != null) ...[
                      const SizedBox(height: 4),
                      Text(subtitle!, style: TextStyle(color: Colors.grey.shade700)),
                    ],
                    const SizedBox(height: 20),
                    ...children,
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _LogoMark extends StatelessWidget {
  const _LogoMark();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 34,
      height: 34,
      decoration: BoxDecoration(color: brand, borderRadius: BorderRadius.circular(8)),
      alignment: Alignment.center,
      child: const Text('H', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 20)),
    );
  }
}

class MessageBox extends StatelessWidget {
  final String message;
  final bool isError;

  const MessageBox({super.key, required this.message, this.isError = true});

  @override
  Widget build(BuildContext context) {
    if (message.isEmpty) return const SizedBox.shrink();
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isError ? const Color(0xFFF8D7DA) : const Color(0xFFD1E7DD),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Semantics(
        liveRegion: true,
        child: Text(message,
            style: TextStyle(color: isError ? const Color(0xFF842029) : const Color(0xFF0F5132))),
      ),
    );
  }
}
