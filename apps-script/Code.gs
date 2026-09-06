const FIREBASE_API_KEY = 'AIzaSyD3e8G3s9Hwk5Kf6Ay3L58RTjyAkL-xr4I';
const FIREBASE_PROJECT_ID = 'medical-cases-c4809';
const LIBRARY_URL = 'https://onehealthgpuc.github.io/cases-site/';
const SENDER_EMAIL = 'onehealthgpuc@gmail.com';

function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents || '{}');
    const caller = verifyFirebaseUser_(request.idToken);
    verifyAdmin_(request.idToken, caller.localId);
    const recipients = loadActiveUserEmails_(request.idToken);
    if (!recipients.length) throw new Error('No active users have an email address.');

    const title = String(request.title || 'Untitled case').trim();
    const caseId = String(request.caseId || '').trim();
    if (!caseId) throw new Error('A case ID is required.');
    const caseUrl = `${LIBRARY_URL}viewcase.html?caseId=${encodeURIComponent(caseId)}`;
    const subject = `New clinical case: ${title}`;
    const help = 'If you are unable to log in, click Forgot password and wait for the link by email. Please check your junk folder.';
    const plainBody = [
      'Hi everyone,', '',
      'A new clinical case is available in the OneHealth Clinical Case Library:', '',
      title, '', `View the case: ${caseUrl}`, '',
      'Please sign in with your OneHealth case-library account to view it.', '',
      help, '', 'Kind regards,', 'OnehealthGPUC team'
    ].join('\n');
    const htmlBody = `<p>Hi everyone,</p>
      <p>A new clinical case is available in the OneHealth Clinical Case Library:</p>
      <p><strong>${escapeHtml_(title)}</strong></p>
      <p><a href="${escapeHtml_(caseUrl)}">View the case</a></p>
      <p>Please sign in with your OneHealth case-library account to view it.</p>
      <p style="color:#777;font-size:12px">${escapeHtml_(help)}</p>
      <p>Kind regards,<br>OnehealthGPUC team</p>`;

    MailApp.sendEmail({
      to: SENDER_EMAIL,
      bcc: recipients.filter(email => email.toLowerCase() !== SENDER_EMAIL).join(','),
      subject,
      body: plainBody,
      htmlBody,
      name: 'OnehealthGPUC',
      replyTo: SENDER_EMAIL
    });
    return json_({ok:true, recipientCount:recipients.length});
  } catch (error) {
    console.error(error);
    return json_({ok:false, error:String(error.message || error)});
  }
}

function verifyFirebaseUser_(idToken) {
  if (!idToken) throw new Error('Sign-in is required.');
  const response = UrlFetchApp.fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`, {
    method:'post', contentType:'application/json', payload:JSON.stringify({idToken}), muteHttpExceptions:true
  });
  const data = JSON.parse(response.getContentText() || '{}');
  if (response.getResponseCode() !== 200 || !data.users || !data.users[0]) throw new Error('Unable to verify the signed-in user.');
  return data.users[0];
}

function firestoreRequest_(path, idToken) {
  const response = UrlFetchApp.fetch(`https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${path}`, {
    headers:{Authorization:`Bearer ${idToken}`}, muteHttpExceptions:true
  });
  const data = JSON.parse(response.getContentText() || '{}');
  if (response.getResponseCode() !== 200) throw new Error(data.error && data.error.message || 'Unable to read library users.');
  return data;
}

function verifyAdmin_(idToken, uid) {
  const profile = firestoreRequest_(`users/${encodeURIComponent(uid)}`, idToken);
  if (!profile.fields || !profile.fields.role || profile.fields.role.stringValue !== 'admin') throw new Error('Administrator access is required.');
}

function loadActiveUserEmails_(idToken) {
  const data = firestoreRequest_('users?pageSize=1000', idToken);
  const emails = (data.documents || []).map(doc => doc.fields || {})
    .filter(fields => fields.role && ['viewer','admin'].includes(fields.role.stringValue))
    .map(fields => fields.email && fields.email.stringValue && fields.email.stringValue.trim().toLowerCase())
    .filter(email => email && /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(email));
  return [...new Set(emails)];
}

function escapeHtml_(value) {
  return String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
