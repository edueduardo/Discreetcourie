import mailchimp from '@mailchimp/mailchimp_marketing'

// Initialize Mailchimp client
mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: process.env.MAILCHIMP_SERVER_PREFIX, // e.g., 'us1'
})

const AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID || ''

// Subscribe customer to mailing list
export async function subscribeToNewsletter(email: string, firstName?: string, lastName?: string) {
  try {
    const response = await mailchimp.lists.addListMember(AUDIENCE_ID, {
      email_address: email,
      status: 'subscribed',
      merge_fields: {
        FNAME: firstName || '',
        LNAME: lastName || '',
      },
    })

    return { success: true, data: response }
  } catch (error: any) {
    if (error.status === 400 && error.response?.body?.title === 'Member Exists') {
      return { success: true, message: 'Already subscribed' }
    }
    console.error('Mailchimp subscribe error:', error)
    return { success: false, error }
  }
}

// Update subscriber information
export async function updateSubscriber(email: string, data: Record<string, any>) {
  try {
    const subscriberHash = require('crypto')
      .createHash('md5')
      .update(email.toLowerCase())
      .digest('hex')

    const response = await mailchimp.lists.updateListMember(
      AUDIENCE_ID,
      subscriberHash,
      {
        merge_fields: data,
      }
    )

    return { success: true, data: response }
  } catch (error) {
    console.error('Mailchimp update error:', error)
    return { success: false, error }
  }
}

// Unsubscribe from list
export async function unsubscribe(email: string) {
  try {
    const subscriberHash = require('crypto')
      .createHash('md5')
      .update(email.toLowerCase())
      .digest('hex')

    await mailchimp.lists.updateListMember(AUDIENCE_ID, subscriberHash, {
      status: 'unsubscribed',
    })

    return { success: true }
  } catch (error) {
    console.error('Mailchimp unsubscribe error:', error)
    return { success: false, error }
  }
}

// Send campaign to segment
export async function sendCampaign(
  subject: string,
  content: string,
  segmentOpts?: any
) {
  try {
    // Create campaign
    const campaign = await mailchimp.campaigns.create({
      type: 'regular',
      recipients: {
        list_id: AUDIENCE_ID,
        segment_opts: segmentOpts,
      },
      settings: {
        subject_line: subject,
        from_name: 'DiscreetCourie',
        reply_to: process.env.ADMIN_EMAIL || 'noreply@discreetcourie.com',
      },
    })

    // Set campaign content
    await mailchimp.campaigns.setContent(campaign.id, {
      html: content,
    })

    // Send campaign
    await mailchimp.campaigns.send(campaign.id)

    return { success: true, campaignId: campaign.id }
  } catch (error) {
    console.error('Mailchimp campaign error:', error)
    return { success: false, error }
  }
}

// Track customer activity
export async function trackEvent(email: string, eventName: string, properties?: Record<string, any>) {
  try {
    await mailchimp.lists.createListMemberEvent(AUDIENCE_ID, email, {
      name: eventName,
      properties,
    })

    return { success: true }
  } catch (error) {
    console.error('Mailchimp event tracking error:', error)
    return { success: false, error }
  }
}

// Get subscriber status
export async function getSubscriberStatus(email: string) {
  try {
    const subscriberHash = require('crypto')
      .createHash('md5')
      .update(email.toLowerCase())
      .digest('hex')

    const member = await mailchimp.lists.getListMember(AUDIENCE_ID, subscriberHash)

    return {
      success: true,
      status: member.status,
      data: member,
    }
  } catch (error) {
    return { success: false, error }
  }
}
