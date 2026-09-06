const ANNOUNCEMENT_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwDS4wlr9iwfewQKNYJGewg4bnJIeFf1pSTTR18oAm1RlSzft0yMjwWH5nLCZnKHMkg/exec';

async function sendCaseAnnouncement(caseData) {
  const user = firebase.auth().currentUser;
  if (!user) throw new Error('Please sign in again.');
  const response = await fetch(ANNOUNCEMENT_ENDPOINT, {
    method: 'POST',
    headers: {'Content-Type':'text/plain;charset=utf-8'},
    body: JSON.stringify({
      idToken: await user.getIdToken(true),
      caseId: caseData.id,
      title: caseData.title || 'Untitled case'
    })
  });
  const result = await response.json();
  if (!result.ok) throw new Error(result.error || 'Unable to send the announcement.');
  return result;
}
