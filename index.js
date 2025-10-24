import axios from 'axios';

const BEARER_TOKEN = 'your_twitter_bearer_token'; // Thay bằng Secrets
const TELEGRAM_TOKEN = 'your_telegram_bot_token';
const TELEGRAM_CHAT_ID = 'your_telegram_chat_id';
const TWITTER_USERNAME = 'elonmusk';

let lastTweetId = '0';

async function getLatestTweets() {
  try {
    const url = `https://api.twitter.com/2/users/by/username/${TWITTER_USERNAME}`;
    const userRes = await axios.get(url, {
      headers: { Authorization: `Bearer ${BEARER_TOKEN}` }
    });
    const userId = userRes.data.data.id;

    const tweetsUrl = `https://api.twitter.com/2/users/${userId}/tweets?max_results=5&tweet.fields=created_at`;
    const tweetsRes = await axios.get(tweetsUrl, {
      headers: { Authorization: `Bearer ${BEARER_TOKEN}` }
    });
    return tweetsRes.data.data || [];
  } catch (error) {
    console.error('Error fetching tweets:', error);
    return [];
  }
}

async function sendToTelegram(text, url) {
  const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  await axios.post(telegramUrl, {
    chat_id: TELEGRAM_CHAT_ID,
    text: `${text}\n\n🔗 ${url}`,
    parse_mode: 'HTML',
    disable_web_page_preview: false
  });
}

async function checkNewTweets() {
  const tweets = await getLatestTweets();
  const newTweets = tweets.filter(t => t.id > lastTweetId);

  for (const tweet of newTweets.reverse()) {
    const text = tweet.text.length > 200 ? tweet.text.substring(0, 200) + '...' : tweet.text;
    const url = `https://x.com/${TWITTER_USERNAME}/status/${tweet.id}`;
    await sendToTelegram(text.replace(/&/g, '&amp;'), url);
    console.log(`Sent tweet: ${url}`);
  }

  if (tweets.length > 0) {
    lastTweetId = tweets[0].id;
  }
}

// Kiểm tra mỗi 10 giây
setInterval(checkNewTweets, 10000);
checkNewTweets(); // Chạy ngay lần đầu
