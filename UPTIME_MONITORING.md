# Uptime Monitoring Setup

## Recommended Services

### Free Tier Options

1. **UptimeRobot** (Recommended - Free)
   - 50 monitors, 5-minute intervals
   - HTTP(s), Ping, Port, Keyword monitoring
   - Email, SMS, Slack, Discord, Telegram alerts

2. **Better Uptime** (Free tier)
   - 10 monitors, 3-minute intervals
   - Status page included
   - On-call scheduling

3. **Cronitor** (Free tier)
   - 5 monitors
   - Heartbeat monitoring for cron jobs

4. **Healthchecks.io** (Free tier)
   - 20 checks
   - Designed for cron job monitoring

### Paid Options (for production)
- **PagerDuty** - Enterprise incident management
- **Datadog Synthetic Monitoring** - Full APM integration
- **New Relic Synthetic** - Full observability platform

## Monitoring Targets

### Frontend (Vercel)
```
Primary: https://your-frontend-domain.com
Health: https://your-frontend-domain.com/api/health (if implemented)
```

### Backend (Render)
```
Primary: https://your-api-domain.com/health
API: https://your-api-domain.com/api/v1/health
```

### Database (Supabase)
- Supabase provides built-in monitoring
- Set up alerts for: CPU > 80%, Memory > 80%, Disk > 80%

## Alert Configuration

### Critical Alerts (Page immediately)
- API health endpoint returns non-200
- Frontend returns 5xx errors
- Database connection failures
- SSL certificate expiry < 14 days

### Warning Alerts (Notify within 15 min)
- API p95 latency > 1s
- Error rate > 1%
- Database CPU > 70%

### Info Alerts (Daily digest)
- Deployment notifications
- SSL certificate expiry < 30 days

## UptimeRobot Setup (Recommended)

1. Create account at uptimerobot.com
2. Add monitors:
   ```
   Type: HTTP(s)
   URL: https://your-api-domain.com/health
   Interval: 5 minutes
   Alert Contacts: Email + Slack/Discord
   ```
3. Add keyword monitor for frontend:
   ```
   Type: Keyword
   URL: https://your-frontend-domain.com
   Keyword: "SheStays" (or unique text on homepage)
   ```
4. Configure alert rules:
   - Down for 2 consecutive checks → Alert
   - Recovery → Alert

## Status Page

Create a public status page:
- **Better Uptime** (free with monitors)
- **Statuspage.io** (Atlassian, paid)
- **Cachet** (self-hosted, open source)

## Integration with CI/CD

Add deployment notifications to monitoring:

```yaml
# In GitHub Actions deploy job
- name: Notify UptimeRobot
  if: success()
  run: |
    curl -X POST "https://api.uptimerobot.com/v2/newMonitor" \
      -d "api_key=${{ secrets.UPTIMEROBOT_API_KEY }}" \
      -d "format=json" \
      -d "type=1" \
      -d "url=${{ secrets.API_URL }}/health"
```

## Runbook for Incidents

### API Down
1. Check Render dashboard for service status
2. Check logs for errors
3. Verify Supabase connectivity
4. Check recent deployments
5. Rollback if needed

### High Latency
1. Check Render metrics (CPU, Memory)
2. Check Supabase metrics
3. Check for slow queries in logs
4. Consider scaling up

### Database Issues
1. Check Supabase dashboard
2. Check connection pool usage
3. Verify no long-running queries
4. Check disk space