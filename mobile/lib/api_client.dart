import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import 'models.dart';

// Pass the deployed address at build time:
// flutter build apk --dart-define=API_URL=https://your-domain
const String apiBaseUrl = String.fromEnvironment('API_URL', defaultValue: 'http://10.0.2.2:5000');

class ApiException implements Exception {
  final int status;
  final String message;

  ApiException(this.status, this.message);

  @override
  String toString() => message;
}

class ApiClient {
  static const _tokenKey = 'hackmatch.token';

  final http.Client _http;
  final String baseUrl;
  String? _token;

  ApiClient({http.Client? httpClient, this.baseUrl = apiBaseUrl}) : _http = httpClient ?? http.Client();

  bool get isLoggedIn => _token != null;

  Future<void> loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString(_tokenKey);
  }

  Future<void> _saveToken(String? token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    if (token == null) {
      await prefs.remove(_tokenKey);
    } else {
      await prefs.setString(_tokenKey, token);
    }
  }

  Future<dynamic> _send(String method, String path, {Map<String, dynamic>? body}) async {
    final request = http.Request(method, Uri.parse('$baseUrl/api$path'));
    if (body != null) {
      request.headers['Content-Type'] = 'application/json';
      request.body = jsonEncode(body);
    }
    if (_token != null) {
      request.headers['Authorization'] = 'Bearer $_token';
    }

    http.Response response;
    try {
      response = await http.Response.fromStream(await _http.send(request).timeout(const Duration(seconds: 20)));
    } on TimeoutException {
      throw ApiException(0, 'The server took too long to answer. Try again.');
    } on http.ClientException {
      throw ApiException(0, "Can't reach the server. Check your connection.");
    }

    if (response.statusCode == 204) return null;
    dynamic data;
    try {
      data = jsonDecode(response.body);
    } on FormatException {
      data = null;
    }
    if (response.statusCode >= 400) {
      final message = data is Map && data['error'] is String ? data['error'] as String : 'Something went wrong';
      throw ApiException(response.statusCode, message);
    }
    return data;
  }

  Future<String> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
  }) async {
    final data = await _send('POST', '/auth/register', body: {
      'email': email,
      'password': password,
      'firstName': firstName,
      'lastName': lastName,
    });
    return data['message'] as String;
  }

  Future<CurrentUser> login(String email, String password) async {
    final data = await _send('POST', '/auth/login', body: {'email': email, 'password': password});
    await _saveToken(data['token'] as String);
    return CurrentUser.fromJson(data['user'] as Map<String, dynamic>);
  }

  Future<void> logout() => _saveToken(null);

  Future<String> resendVerification(String email) async {
    final data = await _send('POST', '/auth/resend-verification', body: {'email': email});
    return data['message'] as String;
  }

  Future<String> forgotPassword(String email) async {
    final data = await _send('POST', '/auth/forgot-password', body: {'email': email});
    return data['message'] as String;
  }

  Future<CurrentUser> me() async {
    final data = await _send('GET', '/me');
    return CurrentUser.fromJson(data['user'] as Map<String, dynamic>);
  }

  Future<CurrentUser> updateMe(Map<String, dynamic> changes) async {
    final data = await _send('PUT', '/me', body: changes);
    return CurrentUser.fromJson(data['user'] as Map<String, dynamic>);
  }

  Future<SearchPage> search(String query, {String role = ''}) async {
    final params = {'q': query, if (role.isNotEmpty) 'role': role};
    final data = await _send('GET', '/attendees/search?${Uri(queryParameters: params).query}');
    return SearchPage(
      results: (data['results'] as List<dynamic>).map((j) => Attendee.fromJson(j as Map<String, dynamic>)).toList(),
      total: data['total'] as int,
    );
  }

  Future<List<ShortlistEntry>> shortlist() async {
    final data = await _send('GET', '/shortlist');
    return (data['entries'] as List<dynamic>)
        .map((j) => ShortlistEntry.fromJson(j as Map<String, dynamic>))
        .toList();
  }

  Future<ShortlistEntry> addToShortlist(String memberId, {String note = ''}) async {
    final data = await _send('POST', '/shortlist', body: {'memberId': memberId, 'note': note});
    return ShortlistEntry.fromJson(data['entry'] as Map<String, dynamic>);
  }

  Future<ShortlistEntry> updateShortlistEntry(String id, {String? note, String? status}) async {
    final data = await _send('PUT', '/shortlist/$id', body: {
      'note': ?note,
      'status': ?status,
    });
    return ShortlistEntry.fromJson(data['entry'] as Map<String, dynamic>);
  }

  Future<void> removeFromShortlist(String id) => _send('DELETE', '/shortlist/$id');
}
