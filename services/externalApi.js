const axios = require('axios');
const NodeCache = require('node-cache');

// Cache external API responses (TTL: 10 minutes)
const cache = new NodeCache({ stdTTL: 600 });

class ExternalApiService {
  
  // Weather API (OpenWeatherMap)
  static async getWeather(city) {
    const cacheKey = `weather_${city}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return { ...cached, cached: true };
    }

    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather`,
        {
          params: {
            q: city,
            appid: process.env.WEATHER_API_KEY,
            units: 'metric'
          },
          timeout: 5000
        }
      );

      const data = {
        city: response.data.name,
        country: response.data.sys.country,
        temperature: response.data.main.temp,
        feels_like: response.data.main.feels_like,
        humidity: response.data.main.humidity,
        description: response.data.weather[0].description,
        icon: response.data.weather[0].icon,
        wind_speed: response.data.wind.speed
      };

      cache.set(cacheKey, data);
      return data;
      
    } catch (error) {
      console.error('Weather API Error:', error.message);
      throw new Error(error.response?.data?.message || 'Weather service unavailable');
    }
  }

  // News API
  static async getNews(country = 'us', category = 'technology') {
    const cacheKey = `news_${country}_${category}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return { ...cached, cached: true };
    }

    try {
      const response = await axios.get(
        `https://newsapi.org/v2/top-headlines`,
        {
          params: {
            country,
            category,
            apiKey: process.env.NEWS_API_KEY,
            pageSize: 5
          },
          timeout: 5000
        }
      );

      if (!response.data.articles || response.data.articles.length === 0) {
        throw new Error('No news articles found');
      }

      const data = {
        totalResults: response.data.totalResults,
        articles: response.data.articles.map(article => ({
          title: article.title || 'No title',
          description: article.description || 'No description',
          url: article.url,
          urlToImage: article.urlToImage,
          publishedAt: article.publishedAt,
          source: article.source?.name || 'Unknown'
        }))
      };

      cache.set(cacheKey, data);
      return data;
      
    } catch (error) {
      console.error('News API Error:', error.response?.data || error.message);
      throw new Error('News service unavailable. Try changing country to "us"');
    }
  }

  // Exchange Rate API
  static async getExchangeRates(base = 'USD') {
    const cacheKey = `exchange_${base}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return { ...cached, cached: true };
    }

    try {
      const response = await axios.get(
        `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_API_KEY}/latest/${base}`,
        { timeout: 5000 }
      );

      const data = {
        base: response.data.base_code,
        date: new Date().toISOString().split('T')[0],
        rates: {
          EUR: response.data.conversion_rates.EUR,
          GBP: response.data.conversion_rates.GBP,
          INR: response.data.conversion_rates.INR,
          JPY: response.data.conversion_rates.JPY,
          AUD: response.data.conversion_rates.AUD
        }
      };

      cache.set(cacheKey, data);
      return data;
      
    } catch (error) {
      console.error('Exchange Rate API Error:', error.message);
      throw new Error('Exchange rate service unavailable');
    }
  }

  // Random User API
  static async getRandomUser() {
    try {
      const response = await axios.get(
        'https://randomuser.me/api/',
        { timeout: 5000 }
      );

      const user = response.data.results[0];
      return {
        name: `${user.name.first} ${user.name.last}`,
        email: user.email,
        phone: user.phone,
        picture: user.picture.large,
        location: `${user.location.city}, ${user.location.country}`,
        age: user.dob.age
      };
      
    } catch (error) {
      console.error('Random User API Error:', error.message);
      throw new Error('Random user service unavailable');
    }
  }

  // Quote API
  static async getRandomQuote() {
    const cacheKey = `quote_${Date.now()}`;
    
    try {
      const response = await axios.get(
        'https://api.quotable.io/random',
        { 
          timeout: 5000,
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (!response.data || !response.data.content) {
        throw new Error('Invalid quote response');
      }

      return {
        content: response.data.content,
        author: response.data.author || 'Unknown',
        tags: response.data.tags || []
      };
      
    } catch (error) {
      console.error('Quote API Error:', error.message);
      throw new Error('Quote service unavailable');
    }
  }

  // GitHub User API (with token support)
  static async getGitHubUser(username) {
    const cacheKey = `github_${username}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return { ...cached, cached: true };
    }

    try {
      const headers = {};
      
      // Add GitHub token if available
      if (process.env.GITHUB_TOKEN) {
        headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
      }
      
      const response = await axios.get(
        `https://api.github.com/users/${username}`,
        { 
          headers,
          timeout: 5000 
        }
      );

      const data = {
        login: response.data.login,
        name: response.data.name || response.data.login,
        avatar: response.data.avatar_url,
        bio: response.data.bio,
        public_repos: response.data.public_repos,
        followers: response.data.followers,
        following: response.data.following,
        created_at: response.data.created_at,
        html_url: response.data.html_url
      };

      cache.set(cacheKey, data);
      return data;
      
    } catch (error) {
      console.error('GitHub API Error:', error.message);
      throw new Error('GitHub user not found or API unavailable');
    }
  }
}

module.exports = ExternalApiService;
