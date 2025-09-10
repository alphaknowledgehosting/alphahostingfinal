const nodemailer = require('nodemailer');

// Create email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    pool: true,
    maxConnections: 5,
    rateDelta: 1000,
    rateLimit: 5
  });
};

// Welcome email template for new users
const getWelcomeEmailTemplate = (user) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://alphaknowledge.in';
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to AlphaKnowledge!</title>
    </head>
    <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #030014 0%, #1a1a2e 100%); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
                <td align="center" style="padding: 40px 20px;">
                    <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">
                        <!-- Header -->
                        <tr>
                            <td align="center" style="padding: 30px; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); border-radius: 15px 15px 0 0;">
                                <h1 style="margin: 0; color: white; font-size: 32px; font-weight: bold;">
                                    🎉 Welcome to AlphaKnowledge!
                                </h1>
                                <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 18px;">
                                    Your Journey to Excellence Begins Now
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px 30px; background: rgba(255, 255, 255, 0.97); border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
                                <div style="text-align: center; margin-bottom: 30px;">
                                    <img src="https://alphaknowledge.in/alphalogo.png" alt="AlphaKnowledge Logo" style="width: 80px; height: 80px; margin-bottom: 20px;">
                                </div>
                                
                                <h2 style="color: #1f2937; margin-bottom: 20px; font-size: 24px; line-height: 1.3; text-align: center;">
                                    Hello ${user.name}! 👋
                                </h2>
                                
                                <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 25px; text-align: center;">
                                    Welcome to <strong>AlphaKnowledge</strong> - your gateway to mastering algorithms, data structures, and competitive programming! We're thrilled to have you join our community of learners and achievers.
                                </p>
                                
                                <div style="background: #f8fafc; border-radius: 10px; padding: 25px; margin: 25px 0;">
                                    <h3 style="color: #1f2937; margin-bottom: 15px; font-size: 18px;">🚀 What You Can Do:</h3>
                                    <ul style="color: #4b5563; line-height: 1.8; margin: 0; padding-left: 20px;">
                                        <li>📚 Access comprehensive study sheets and practice problems</li>
                                        <li>🎯 Track your learning progress and achievements</li>
                                        <li>📢 Stay updated with the latest announcements and features</li>
                                        <li>💡 Get editorial solutions and video explanations</li>
                                        <li>🏆 Challenge yourself with curated problem sets</li>
                                    </ul>
                                </div>
                                
                                <div style="text-align: center; margin: 35px 0;">
                                    <a href="${frontendUrl}" 
                                       style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); 
                                              color: white; text-decoration: none; padding: 15px 30px; 
                                              border-radius: 8px; font-weight: bold; font-size: 18px;
                                              box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);">
                                        🌟 Start Exploring AlphaKnowledge
                                    </a>
                                </div>
                                
                                <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 8px; padding: 20px; margin-top: 25px; text-align: center;">
                                    <p style="color: #92400e; font-size: 14px; margin: 0;">
                                        💌 <strong>Pro Tip:</strong> Bookmark <a href="${frontendUrl}" style="color: #92400e; font-weight: bold;">alphaknowledge.in</a> for quick access to your learning dashboard!
                                    </p>
                                </div>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td align="center" style="padding: 25px; background: rgba(255, 255, 255, 0.95); border-radius: 0 0 15px 15px; border: 1px solid #e5e7eb;">
                                <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                                    Welcome aboard! | ${new Date().toLocaleDateString('en-US', {
                                      timeZone: 'Asia/Kolkata',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                </p>
                                <p style="color: #6b7280; font-size: 12px; margin: 0;">
                                    © 2025 AlphaKnowledge. Happy Learning! 🎓
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
  `;
};

// Announcement email template
const getAnnouncementEmailTemplate = (announcement, type) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://alphaknowledge.in';
  
  const typeConfigs = {
    urgent: {
      color: '#ef4444',
      bgColor: 'background: #fee2e2; border: 2px solid #fecaca;',
      badge: 'background: #ef4444; color: white;',
      emoji: '🚨',
      title: 'URGENT ANNOUNCEMENT',
      subtitle: 'Immediate Attention Required'
    },
    important: {
      color: '#ea580c',
      bgColor: 'background: #fed7aa; border: 2px solid #fdba74;',
      badge: 'background: #ea580c; color: white;',
      emoji: '⚠️',
      title: 'IMPORTANT ANNOUNCEMENT',
      subtitle: 'Please Review Carefully'
    },
    info: {
      color: '#2563eb',
      bgColor: 'background: #dbeafe; border: 2px solid #93c5fd;',
      badge: 'background: #2563eb; color: white;',
      emoji: 'ℹ️',
      title: 'NEW ANNOUNCEMENT',
      subtitle: 'Latest Update Available'
    }
  };

  const config = typeConfigs[type] || typeConfigs.info;
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${config.emoji} ${config.title} - AlphaKnowledge</title>
    </head>
    <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #030014 0%, #1a1a2e 100%); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
                <td align="center" style="padding: 40px 20px;">
                    <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">
                        <!-- Header -->
                        <tr>
                            <td align="center" style="padding: 30px; background: ${config.color}; border-radius: 15px 15px 0 0;">
                                <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">
                                    ${config.emoji} ${config.title}
                                </h1>
                                <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                                    AlphaKnowledge - ${config.subtitle}
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px 30px; background: rgba(255, 255, 255, 0.97); border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
                                <div style="${config.bgColor} border-radius: 8px; padding: 15px; margin-bottom: 25px;">
                                    <span style="${config.badge} padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
                                        ${type.toUpperCase()}
                                    </span>
                                </div>
                                
                                <h2 style="color: #1f2937; margin-bottom: 20px; font-size: 24px; line-height: 1.3;">
                                    ${announcement.title}
                                </h2>
                                
                                <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                                    ${announcement.content}
                                </p>
                                
                                ${announcement.links && announcement.links.length > 0 ? `
                                    <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                                        <p style="font-weight: bold; margin-bottom: 15px; color: #1f2937;">Important Links:</p>
                                        ${announcement.links.map(link => `
                                            <a href="${link.url}" 
                                               style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); 
                                                      color: white; text-decoration: none; padding: 12px 20px; 
                                                      border-radius: 6px; margin: 5px 5px 5px 0; font-weight: bold;">
                                                ${link.text} →
                                            </a>
                                        `).join('')}
                                    </div>
                                ` : ''}
                                
                                <div style="margin-top: 35px; padding: 25px; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); border-radius: 8px; text-align: center;">
                                    <a href="${frontendUrl}/announcements" 
                                       style="color: white; text-decoration: none; font-size: 18px; font-weight: bold;">
                                        📢 View All Announcements
                                    </a>
                                </div>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td align="center" style="padding: 25px; background: rgba(255, 255, 255, 0.95); border-radius: 0 0 15px 15px; border: 1px solid #e5e7eb;">
                                <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                                    Posted by: ${announcement.author} | ${new Date(announcement.createdAt).toLocaleString('en-US', {
                                      timeZone: 'Asia/Kolkata',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })} IST
                                </p>
                                <p style="color: #6b7280; font-size: 12px; margin: 0;">
                                    © 2025 AlphaKnowledge. You received this because you're part of our learning community.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
  `;
};

// UPDATED: Send welcome email to new users
const sendWelcomeEmail = async (user) => {
  try {
    // console.log(`📧 Sending welcome email to new user: ${user.email}`);
    
    const transporter = createTransporter();
    const frontendUrl = process.env.FRONTEND_URL || 'https://alphaknowledge.in';
    
    const emailSubject = `🎉 Welcome to AlphaKnowledge, ${user.name}!`;
    const emailBody = getWelcomeEmailTemplate(user);

    await transporter.sendMail({
      from: {
        name: 'AlphaKnowledge - Welcome Team',
        address: process.env.SMTP_USER,
      },
      to: user.email,
      subject: emailSubject,
      html: emailBody,
      priority: 'normal'
    });

    // console.log(`✅ Welcome email sent successfully to: ${user.email}`);
    return { success: true, message: 'Welcome email sent successfully' };
    
  } catch (error) {
    // console.error(`❌ Failed to send welcome email to ${user.email}:`, error);
    return { success: false, error: error.message };
  }
};

// UPDATED: Send email to all users ONLY for urgent announcements
const sendEmailToAllUsers = async (announcement, users, type = 'info') => {
  try {
    // CRITICAL: Only send emails for urgent announcements
    if (type !== 'urgent') {
      // console.log(`📧 Email sending skipped: ${type.toUpperCase()} announcement (emails only sent for URGENT announcements)`);
      return { success: true, count: 0, skipped: true, reason: 'Non-urgent announcement' };
    }

    // console.log(`🚨 URGENT announcement detected - preparing to send emails to all users`);
    
    const transporter = createTransporter();
    
    // Filter users with valid emails
    const emailList = users
      .filter(user => user.email && user.email.includes('@'))
      .map(user => user.email);

    if (emailList.length === 0) {
      // console.log('❌ No users with valid emails found');
      return { success: true, count: 0, reason: 'No valid email addresses' };
    }

    // console.log(`📧 Found ${emailList.length} users with valid email addresses`);

    // Create urgent email content
    const emailSubject = `🚨 URGENT: ${announcement.title} - AlphaKnowledge`;
    const emailBody = getAnnouncementEmailTemplate(announcement, type);

    // Send emails in batches to avoid rate limiting
    const batchSize = 20; // Smaller batch size for urgent emails
    let totalSent = 0;
    const errors = [];

    // console.log(`📧 Sending URGENT emails in batches of ${batchSize}...`);

    for (let i = 0; i < emailList.length; i += batchSize) {
      const batch = emailList.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(emailList.length / batchSize);
      
      try {
        // console.log(`📧 Sending batch ${batchNumber}/${totalBatches} (${batch.length} recipients)...`);
        
        await transporter.sendMail({
          from: {
            name: 'AlphaKnowledge - URGENT ALERT',
            address: process.env.SMTP_USER,
          },
          bcc: batch, // Use BCC to hide recipient list
          subject: emailSubject,
          html: emailBody,
          priority: 'high',
          headers: {
            'X-Priority': '1',
            'X-MSMail-Priority': 'High',
            'Importance': 'high'
          }
        });
        
        totalSent += batch.length;
        // console.log(`✅ Batch ${batchNumber}/${totalBatches} sent successfully (${batch.length} emails)`);
        
      } catch (batchError) {
        // console.error(`❌ Error sending batch ${batchNumber}/${totalBatches}:`, batchError.message);
        errors.push({ 
          batch: batchNumber, 
          recipients: batch.length,
          error: batchError.message 
        });
      }
      
      // Add delay between batches to avoid rate limiting
      if (i + batchSize < emailList.length) {
        // console.log('⏳ Waiting 1 second before next batch...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const success = totalSent > 0;
    const result = {
      success,
      count: totalSent,
      total: emailList.length,
      type: 'urgent',
      errors: errors.length > 0 ? errors : undefined
    };

    if (success) {
      // console.log(`🎉 URGENT announcement emails sent successfully: ${totalSent}/${emailList.length} delivered`);
    } else {
      // console.error(`❌ URGENT announcement email sending failed: 0/${emailList.length} delivered`);
    }

    return result;

  } catch (error) {
    // console.error('❌ Critical error sending URGENT announcement emails:', error);
    return { 
      success: false, 
      count: 0,
      error: error.message,
      type: 'urgent'
    };
  }
};

module.exports = {
  sendEmailToAllUsers,
  sendWelcomeEmail,
  getAnnouncementEmailTemplate,
  getWelcomeEmailTemplate
};
