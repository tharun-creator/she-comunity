import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp up to 20 users
    { duration: '1m', target: 50 },    // Ramp up to 50 users
    { duration: '2m', target: 100 },   // Ramp up to 100 users (target)
    { duration: '2m', target: 100 },   // Stay at 100 users
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'],    // Error rate < 1%
    errors: ['rate<0.01'],             // Custom error rate < 1%
  },
};

// Base URL - set via environment variable or default
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';
const API_BASE = `${BASE_URL}/api/v1`;

// Test data
const testUsers = [];
const authTokens = [];

// Setup: Create test users and get auth tokens
export function setup() {
  // In a real test, you would create users via API or use pre-seeded test accounts
  // For now, return empty - tests will use mock data
  return { baseUrl: BASE_URL };
}

export default function (data) {
  const baseUrl = data.baseUrl;
  
  // Test 1: Health check
  healthCheck(baseUrl);
  
  // Test 2: List PGs (public endpoint)
  listPgs(baseUrl);
  
  // Test 3: Search PGs
  searchPgs(baseUrl);
  
  // Test 4: Get PG detail (if we have PG IDs)
  getPgDetail(baseUrl);
  
  sleep(1);
}

function healthCheck(baseUrl) {
  const res = http.get(`${baseUrl}/health`);
  const success = check(res, {
    'health check status 200': (r) => r.status === 200,
    'health check response time < 200ms': (r) => r.timings.duration < 200,
  });
  errorRate.add(!success);
}

function listPgs(baseUrl) {
  const res = http.get(`${baseUrl}/api/v1/pgs?limit=20`);
  const success = check(res, {
    'list PGs status 200': (r) => r.status === 200,
    'list PGs response time < 300ms': (r) => r.timings.duration < 300,
    'list PGs has data': (r) => r.json().data && Array.isArray(r.json().data),
  });
  errorRate.add(!success);
}

function searchPgs(baseUrl) {
  const queries = ['sholinganallur', 'nungambakkam', 'velachery', 'anna nagar', 'pg'];
  const query = queries[Math.floor(Math.random() * queries.length)];
  
  const res = http.get(`${baseUrl}/api/v1/pgs/search?q=${encodeURIComponent(query)}&limit=20`);
  const success = check(res, {
    'search PGs status 200': (r) => r.status === 200,
    'search PGs response time < 500ms': (r) => r.timings.duration < 500,
    'search PGs has data': (r) => r.json().data && Array.isArray(r.json().data),
  });
  errorRate.add(!success);
}

function getPgDetail(baseUrl) {
  // First get a list of PGs to pick a valid ID
  const listRes = http.get(`${baseUrl}/api/v1/pgs?limit=1`);
  if (listRes.status === 200) {
    const data = listRes.json();
    if (data.data && data.data.length > 0) {
      const pgId = data.data[0].id;
      const res = http.get(`${baseUrl}/api/v1/pgs/${pgId}`);
      const success = check(res, {
        'get PG detail status 200': (r) => r.status === 200,
        'get PG detail response time < 300ms': (r) => r.timings.duration < 300,
      });
      errorRate.add(!success);
    }
  }
}

// Authenticated tests (require valid token)
export function authenticatedTests(data) {
  // These tests would run with auth token
  // For now, placeholder
}