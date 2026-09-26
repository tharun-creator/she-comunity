# Load Testing with k6

## Prerequisites

1. Install k6:
   ```bash
   # macOS
   brew install k6
   
   # Windows (Chocolatey)
   choco install k6
   
   # Windows (Scoop)
   scoop install k6
   
   # Linux (Debian/Ubuntu)
   sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
   echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
   sudo apt-get update
   sudo apt-get install k6
   ```

2. Deploy the API to a test environment (Render staging, local, etc.)

## Running the Load Test

### Basic run (local development)
```bash
k6 run load-test.js
```

### Run against deployed staging
```bash
BASE_URL=https://your-staging-api.onrender.com k6 run load-test.js
```

### Run with custom VUs and duration
```bash
k6 run --vus 50 --duration 2m load-test.js
```

### Output to JSON for CI/CD
```bash
k6 run --out json=results.json load-test.js
```

### Cloud execution (k6 Cloud)
```bash
k6 cloud load-test.js
```

## Test Scenarios

The test covers:
1. **Health check** - Basic API availability
2. **List PGs** - Public endpoint, most frequent
3. **Search PGs** - Full-text search, heavier query
4. **PG Detail** - Single item fetch with joins

## Thresholds

- `http_req_duration`: p(95) < 500ms
- `http_req_failed`: rate < 1%
- Custom `errors` metric: rate < 1%

## Interpreting Results

| Metric | Target | Action if Failed |
|--------|--------|------------------|
| p(95) latency | < 500ms | Add indexes, optimize queries, increase DB resources |
| Error rate | < 1% | Check logs, fix bugs, add circuit breakers |
| Throughput | > 100 req/s | Scale horizontally, add caching |

## CI/CD Integration

Add to GitHub Actions:

```yaml
- name: Run load tests
  run: |
    BASE_URL=${{ secrets.STAGING_API_URL }} k6 run load-test.js
  env:
    K6_CLOUD_TOKEN: ${{ secrets.K6_CLOUD_TOKEN }}
```

## Local Development Testing

For local testing without deployed backend:
```bash
# Start the API locally first
cd apps/api
uvicorn main:app --reload --port 8000

# In another terminal
cd ..
k6 run load-test.js
```