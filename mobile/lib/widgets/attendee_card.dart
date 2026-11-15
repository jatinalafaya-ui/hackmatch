import 'package:material_ui/material_ui.dart';

import '../models.dart';
import '../theme.dart';

class AttendeeCard extends StatelessWidget {
  final Attendee person;
  final Widget? footer;

  const AttendeeCard({super.key, required this.person, this.footer});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundColor: brandLight,
                  child: Text(person.initials, style: const TextStyle(color: brand, fontWeight: FontWeight.bold)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(person.fullName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: person.isMentor ? mentorBrown : brand,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              person.isMentor ? 'Mentor' : 'Hacker',
                              style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                            ),
                          ),
                          const SizedBox(width: 6),
                          Flexible(child: Text(person.school, overflow: TextOverflow.ellipsis)),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            if (person.skills.isNotEmpty) ...[
              const SizedBox(height: 12),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  for (final skill in person.skills)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                      decoration: BoxDecoration(color: brandLight, borderRadius: BorderRadius.circular(999)),
                      child: Text(skill,
                          style: const TextStyle(color: brand, fontSize: 12, fontWeight: FontWeight.w600)),
                    ),
                ],
              ),
            ],
            if (person.lookingFor.isNotEmpty) ...[
              const SizedBox(height: 10),
              Text.rich(TextSpan(children: [
                const TextSpan(text: 'Looking for: ', style: TextStyle(fontWeight: FontWeight.w600)),
                TextSpan(text: person.lookingFor),
              ])),
            ],
            if (footer != null) ...[const SizedBox(height: 12), footer!],
          ],
        ),
      ),
    );
  }
}
