# NeoType Deployment Guide for Render

This guide will help you deploy your NeoType application to Render.

## Prerequisites

1. A Render account (sign up at https://render.com)
2. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
3. The deployment files are already prepared in this project

## Deployment Steps

### 1. Prepare Your Repository

Make sure your repository contains all the deployment files:
- `requirements.txt` - Python dependencies
- `build.sh` - Build script for Render
- `Procfile` - Process definition
- `render.yaml` - Render configuration (optional)

### 2. Create a New Web Service on Render

1. Go to https://render.com/dashboard
2. Click "New +" and select "Web Service"
3. Connect your Git repository
4. Configure the service:

**Basic Settings:**
- **Name**: `neotype` (or your preferred name)
- **Runtime**: `Python 3`
- **Build Command**: `./build.sh`
- **Start Command**: `gunicorn neotype.wsgi:application`

**Advanced Settings:**
- **Auto-Deploy**: Yes (recommended)
- **Instance Type**: Free (for testing) or Starter+ (for production)

### 3. Set Environment Variables

In the Render dashboard, go to your service settings and add these environment variables:

**Required:**
- `DEBUG` = `False`
- `SECRET_KEY` = `your-secret-key-here` (generate a new one)
- `DJANGO_SETTINGS_MODULE` = `neotype.settings`

**Optional Database (PostgreSQL):**
If you want to use PostgreSQL instead of SQLite:
- `DATABASE_URL` = (Render will provide this if you add a PostgreSQL database)

**Optional Email (if you plan to add email features):**
- `EMAIL_HOST` = your SMTP host
- `EMAIL_HOST_USER` = your email username
- `EMAIL_HOST_PASSWORD` = your email password

### 4. Add a Database (Optional but Recommended)

For production, it's recommended to use PostgreSQL:

1. In Render dashboard, click "New +" and select "PostgreSQL"
2. Configure:
   - **Name**: `neotype-db`
   - **Database**: `neotype`
   - **User**: `neotype`
   - **Plan**: Free (for testing)

3. Once created, copy the **Internal Database URL** and add it as `DATABASE_URL` environment variable in your web service.

### 5. Deploy

1. Click "Create Web Service" or "Deploy Latest Commit"
2. Render will:
   - Install dependencies
   - Run database migrations
   - Collect static files
   - Populate sample text content
   - Start the application

### 6. Configure Domain (Optional)

Once deployed, you can:
- Use the provided `.onrender.com` URL
- Add a custom domain in the service settings

## Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DEBUG` | Django debug mode | `True` | No |
| `SECRET_KEY` | Django secret key | Auto-generated | Yes |
| `DATABASE_URL` | PostgreSQL connection string | SQLite | No |
| `DJANGO_SETTINGS_MODULE` | Settings module | `neotype.settings` | Yes |
| `EMAIL_HOST` | SMTP server | `smtp.gmail.com` | No |
| `EMAIL_PORT` | SMTP port | `587` | No |
| `EMAIL_HOST_USER` | Email username | - | No |
| `EMAIL_HOST_PASSWORD` | Email password | - | No |

## Post-Deployment

### 1. Create Superuser (Optional)

To access the Django admin:

1. Go to your Render service dashboard
2. Open the "Shell" tab
3. Run: `python manage.py createsuperuser`
4. Follow the prompts to create an admin user

### 2. Test the Application

1. Visit your deployed URL
2. Test the typing functionality
3. Create a test account
4. Verify all features work correctly

### 3. Monitor Performance

- Check the Render dashboard for logs and metrics
- Monitor response times and error rates
- Scale up the instance type if needed

## Troubleshooting

### Common Issues:

1. **Build Failed**: Check the build logs for missing dependencies or syntax errors
2. **Static Files Not Loading**: Ensure `DEBUG=False` and whitenoise is properly configured
3. **Database Errors**: Verify DATABASE_URL is correctly set
4. **Import Errors**: Make sure all dependencies are in requirements.txt

### Getting Help:

- Check Render documentation: https://render.com/docs
- Review Django deployment best practices
- Check the application logs in Render dashboard

## Security Notes

- Never commit secret keys to version control
- Use environment variables for sensitive data
- Enable HTTPS (Render provides this automatically)
- Consider rate limiting for production use

## Scaling

For high traffic:
- Upgrade to Starter+ or Professional plans
- Consider adding Redis for caching
- Implement CDN for static files
- Monitor database performance

That's it! Your NeoType application should now be deployed and accessible on Render.