# Setting up Cron Jobs (cron-job.org)

Vercel Hobby tier only allows one cron job per day, running at midnight UTC. To reliably trigger the 5x daily Kanji Dojo schedule (Tbilisi Time UTC+4), we use the free external service **cron-job.org**.

## The Schedule

The Dojo operates strictly on **Tbilisi Time (UTC+4)**. We need to ping the backend endpoints at these times:

1. **Morning Broadcast:** 08:00 (UTC+4) -> `POST /api/cron/morning`
2. **Nag Reminders:** 11:00, 15:00, 18:00, 21:00 (UTC+4) -> `POST /api/cron/nag`

*Note: cron-job.org allows you to specify the timezone directly when creating the schedule, so simply select `Asia/Tbilisi` or `UTC+04:00` and use the times above.*

## Setup Instructions

1. **Create an Account:** Sign up or log in at [cron-job.org](https://cron-job.org).
2. **Create New Cron Job:** Click "Create Cronjob" in your dashboard.
3. **Configure the Morning Broadcast:**
   - **Title:** `Kanji Dojo - Morning Broadcast`
   - **URL:** `https://<YOUR_APP_DOMAIN>/api/cron/morning`
   - **Execution schedule:** User-defined (Select specific times)
     - Timezone: `Asia/Tbilisi`
     - Hours: `8`
     - Minutes: `0`
     - Days, Months, Days of Week: `*` (All)
   - **Advanced options:**
     - **HTTP Method:** `POST`
     - **Headers:** Add a new header:
       - Key: `Authorization`
       - Value: `Bearer <YOUR_CRON_SECRET>` (Match the `CRON_SECRET` from your Vercel environment variables)
4. **Configure the Nag Reminders:**
   - Save the morning job, then create another new job.
   - **Title:** `Kanji Dojo - Nag`
   - **URL:** `https://<YOUR_APP_DOMAIN>/api/cron/nag`
   - **Execution schedule:** User-defined
     - Timezone: `Asia/Tbilisi`
     - Hours: `11, 15, 18, 21`
     - Minutes: `0`
     - Days, Months, Days of Week: `*` (All)
   - **Advanced options:**
     - **HTTP Method:** `POST`
     - **Headers:** Add a new header:
       - Key: `Authorization`
       - Value: `Bearer <YOUR_CRON_SECRET>`

## Testing the triggers
You can click "Test run" in the cron-job.org dashboard to manually trigger them. If configured correctly, you should receive a 200 OK response and the Discord/Telegram bot should output the respective messages.
