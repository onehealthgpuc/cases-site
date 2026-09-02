function buildGmailDraftUrl(caseData, recipients) {
  const title = caseData.title || 'Untitled case';
  const caseUrl = new URL('viewcase.html', 'https://onehealthgpuc.github.io/cases-site/');
  caseUrl.searchParams.set('caseId', caseData.id);
  const body = [
    'Hi everyone,',
    '',
    'A new clinical case is available in the OneHealth Clinical Case Library:',
    '',
    title,
    '',
    `View the case: ${caseUrl.href}`,
    '',
    'Please sign in with your OneHealth case-library account to view it.',
    '',
    'Kind regards,',
    'OneHealth'
  ].join('\n');
  const gmail = new URL('https://mail.google.com/mail/');
  gmail.searchParams.set('view', 'cm');
  gmail.searchParams.set('fs', '1');
  gmail.searchParams.set('bcc', recipients.join(','));
  gmail.searchParams.set('su', `New clinical case: ${title}`);
  gmail.searchParams.set('body', body);
  return gmail.href;
}
