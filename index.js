import axios from 'axios';
// Lấy từ GitHub Secrets
const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const TWITTER_USERNAME = process.env.TWITTER_USERNAME;
// File lưu ID tweet cuối cùng đã gửi
const LAST_ID_FILE = 'last-tweet-id.txt';
async function getLastTweetId() {
  try {
    const res = await axios.get(`https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/contents/${LAST_ID_FILE}`, {
      headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` }
    });
    return atob(res.data.content).trim();
  } catch (e) {
    return null;
  }
}
async function updateLastTweetId(id) {
  const content = btoa(id);
  try {
    const res = await axios.get(`https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/contents/${LAST_ID_FILE}`, {
      headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` }
    });
    await axios.put(`https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/contents/${LAST_ID_FILE}`, {
      message: 'Update last tweet ID',
      content: content,
      sha: res.data.sha,
      branch: 'main'
    }, {
      headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` }
    });
  } catch (e) {
    await axios.put(`https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/contents/${LAST_ID_FILE}`, {
      message: 'Create last tweet ID',
      content: content,
      branch: 'main'
    }, {
      headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` }
    });
  }
}
async function getLatestTweets() {
  const url = `https://api.twitter.com/2/users/by/username/${TWITTER_USERNAME}`;
  const userRes = await axios.get(url, {
    headers: { Authorization: `Bearer ${BEARER_TOKEN}` }
  });
  const userId = userRes.data.data.id;
  const tweetsUrl = `https://api.twitter.com/2/users/${userId}/tweets?max_results=1&tweet.fields=created_at`;
  const tweetsRes = await axios.get(tweetsUrl, {
    headers: { Authorization: `Bearer ${BEARER_TOKEN}` }
  });
  return tweetsRes.data.data || [];
}
async function sendToTelegram(text, url) {
  const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  await axios.post(telegramUrl, {
    chat_id: TELEGRAM_CHAT_ID,
    text: `${text}\n\ ${url}`,
    parse_mode: 'HTML',
    disable_web_page_preview: false
  });
}
async function main() {
  const lastId = await getLastTweetId();
  const tweets = await getLatestTweets();
  if (tweets.length > 0) {
    const latest = tweets[0];
    if (!lastId || latest.id > lastId) {
      const text = latest.text.length > 200
        ? latest.text.substring(0, 200) + '...'
        : latest.text;
      const url = `https://x.com/${TWITTER_USERNAME}/status/${latest.id}`;
      await sendToTelegram(text.replace(/&/g, '&amp;'), url);
      await updateLastTweetId(latest.id);
    }
  }
}
main().catch(console.error);
