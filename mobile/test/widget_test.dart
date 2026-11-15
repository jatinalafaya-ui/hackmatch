import 'dart:convert';

import 'package:material_ui/material_ui.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hackmatch/api_client.dart';
import 'package:hackmatch/main.dart';
import 'package:hackmatch/models.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _attendeeJson = {
  'id': '64b000000000000000000001',
  'firstName': 'Priya',
  'lastName': 'Natarajan',
  'role': 'hacker',
  'school': 'USF',
  'skills': ['Flutter', 'Dart'],
  'lookingFor': 'Anyone who wants to ship a mobile app',
  'bio': '',
};

void main() {
  setUp(() => SharedPreferences.setMockInitialValues({}));

  test('Attendee.fromJson reads every field and builds initials', () {
    final person = Attendee.fromJson(_attendeeJson);
    expect(person.fullName, 'Priya Natarajan');
    expect(person.initials, 'PN');
    expect(person.skills, ['Flutter', 'Dart']);
    expect(person.isMentor, isFalse);
  });

  test('search sends the query and the saved token to the server', () async {
    late http.Request sent;
    final client = MockClient((request) async {
      sent = request;
      if (request.url.path == '/api/auth/login') {
        return http.Response(jsonEncode({'token': 'jwt-123', 'user': {..._attendeeJson, 'email': 'p@x.com'}}), 200);
      }
      return http.Response(jsonEncode({'results': [_attendeeJson], 'total': 1, 'page': 1, 'pageSize': 20}), 200);
    });
    final api = ApiClient(httpClient: client, baseUrl: 'https://hackmatch.test');

    await api.login('p@x.com', 'secret123');
    final page = await api.search('flut', role: 'hacker');

    expect(sent.url.toString(), 'https://hackmatch.test/api/attendees/search?q=flut&role=hacker');
    expect(sent.headers['Authorization'], 'Bearer jwt-123');
    expect(page.total, 1);
    expect(page.results.single.lastName, 'Natarajan');
  });

  test('server errors become ApiException with the server message', () async {
    final client = MockClient((_) async => http.Response(jsonEncode({'error': 'Verify your email before logging in'}), 403));
    final api = ApiClient(httpClient: client, baseUrl: 'https://hackmatch.test');

    expect(
      () => api.login('p@x.com', 'secret123'),
      throwsA(isA<ApiException>().having((e) => e.status, 'status', 403)),
    );
  });

  testWidgets('app opens on the login screen and shows a failed login', (tester) async {
    final client = MockClient((_) async => http.Response(jsonEncode({'error': 'Email or password is incorrect'}), 401));
    await tester.pumpWidget(HackMatchApp(api: ApiClient(httpClient: client, baseUrl: 'https://hackmatch.test')));
    await tester.pumpAndSettle();

    expect(find.text('Log in'), findsWidgets);
    await tester.enterText(find.widgetWithText(TextField, 'Email'), 'p@x.com');
    await tester.enterText(find.widgetWithText(TextField, 'Password'), 'wrongpass1');
    await tester.tap(find.widgetWithText(FilledButton, 'Log in'));
    await tester.pumpAndSettle();

    expect(find.text('Email or password is incorrect'), findsOneWidget);
  });
}
