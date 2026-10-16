// Gmail -> Slack alert for customer emails with no reply within SLA.
// Setup: see README.md in this folder.

const CONFIG = {
  customerDomains: ['customer1.com', 'customer2.com'], // or full addresses
  slaHours: 4,                                         // alert if unanswered this long
  slackWebhookUrl: 'https://hooks.slack.com/services/XXX/YYY/ZZZ',
  mentionUserIds: ['U01234567', 'U07654321'],          // Slack member IDs to tag
  lookbackDays: 7,                                     // ignore older threads
};

function checkUnrepliedEmails() {
  const props = PropertiesService.getScriptProperties();
  const query = `in:inbox newer_than:${CONFIG.lookbackDays}d from:(${CONFIG.customerDomains.join(' OR ')})`;
  const cutoff = Date.now() - CONFIG.slaHours * 3600 * 1000;

  for (const thread of GmailApp.search(query, 0, 100)) {
    const msgs = thread.getMessages();
    const last = msgs[msgs.length - 1];
    // If the last message is ours, it's replied.
    if (!isCustomer(last.getFrom())) continue;
    if (last.getDate().getTime() > cutoff) continue;
    // Alert once per unanswered customer message.
    if (props.getProperty(thread.getId()) === last.getId()) continue;

    postToSlack(thread, last);
    props.setProperty(thread.getId(), last.getId());
  }
}

function isCustomer(from) {
  const f = from.toLowerCase();
  return CONFIG.customerDomains.some(d => f.includes(d.toLowerCase()));
}

function postToSlack(thread, msg) {
  const hours = Math.floor((Date.now() - msg.getDate().getTime()) / 3600000);
  const mentions = CONFIG.mentionUserIds.map(id => `<@${id}>`).join(' ');
  const text = `${mentions} :rotating_light: Customer email unanswered for ${hours}h\n` +
    `*From:* ${msg.getFrom()}\n*Subject:* ${thread.getFirstMessageSubject()}\n` +
    `<${thread.getPermalink()}|Open in Gmail>`;
  const res = UrlFetchApp.fetch(CONFIG.slackWebhookUrl, {
    method: 'post', contentType: 'application/json',
    payload: JSON.stringify({ text }), muteHttpExceptions: true,
  });
  if (res.getResponseCode() !== 200) throw new Error('Slack error: ' + res.getContentText());
}

// Run once to schedule checks every 15 minutes.
function installTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('checkUnrepliedEmails').timeBased().everyMinutes(15).create();
}
