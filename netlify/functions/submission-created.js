// Netlify Function: Triggered on form submission
// Adds submitted emails to Mailchimp with double opt-in (status: pending).
// Configure environment variables in Netlify:
// - MAILCHIMP_API_KEY (e.g., abcd-us21)
// - MAILCHIMP_LIST_ID (audience/list ID)

exports.handler = async (event) => {
  try {
    const { body, headers } = event;
    // Verify it's a Netlify forms event
    if (!headers['user-agent']?.includes('Netlify') && !headers['x-netlify-event']) {
      return { statusCode: 200, body: 'Ignored: not a Netlify forms event' };
    }

    const payload = JSON.parse(body || '{}');
    const data = payload?.payload?.data || {};
    const formName = payload?.payload?.form_name || 'unknown';

    // Only process our specific form
    if (formName !== 'notify') {
      return { statusCode: 200, body: `Ignored form: ${formName}` };
    }

    const email = (data.email || '').trim();
    if (!email) {
      return { statusCode: 200, body: 'No email provided' };
    }

    const apiKey = process.env.MAILCHIMP_API_KEY;
    const listId = process.env.MAILCHIMP_LIST_ID;

    if (!apiKey || !listId) {
      // If not configured, just succeed silently so the form still works.
      return { statusCode: 200, body: 'Mailchimp not configured' };
    }

    const dc = apiKey.split('-')[1];
    if (!dc) throw new Error('Invalid Mailchimp API key (missing datacenter).');

    const url = `https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(`any:${apiKey}`).toString('base64'),
      },
      body: JSON.stringify({
        email_address: email,
        status: 'pending', // double opt-in
      }),
    });

    // Accept duplicates and other benign errors without failing the submission
    if (!res.ok) {
      const msg = await res.text();
      // 400 with member exists -> fine
      if (!/is already a list member|Member Exists/i.test(msg)) {
        console.warn('Mailchimp error:', msg);
      }
    }

    return { statusCode: 200, body: 'ok' };
  } catch (err) {
    console.error(err);
    return { statusCode: 200, body: 'error (ignored)' };
  }
};
