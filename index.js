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
    if (error.response && error.response.status === 429) {
      console.error('Rate limit exceeded. Waiting 15 minutes before retrying...');
      await new Promise(resolve => setTimeout(resolve, 15 * 60 * 1000)); // Chờ 15 phút
      return getLatestTweets(); // Thử lại
    }
    console.error('Error fetching tweets:', error.message);
    return [];
  }
}
