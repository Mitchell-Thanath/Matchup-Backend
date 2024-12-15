import axios from 'axios';

const API_KEY = process.env.API_FOOTBALL_KEY;
const API_BASE_URL = 'https://api-football-v1.p.rapidapi.com/v3';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
    'x-rapidapi-key': API_KEY
  }
});

export interface LiveMatch {
  fixture: {
    id: number;
    date: string;
    status: { elapsed: number; long: string };
    venue: { name: string; city: string };
  };
  league: {
    name: string;
    country: string;
  };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  goals: {
    home: number;
    away: number;
  };
}

export interface TeamStats {
  team: {
    id: number;
    name: string;
    logo: string;
  };
  stats: {
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
  };
}

class SportsApiService {
  async getLiveMatches(): Promise<LiveMatch[]> {
    try {
      const response = await apiClient.get('/fixtures', {
        params: { live: 'all' }
      });
      return response.data.response;
    } catch (error) {
      console.error('Error fetching live matches:', error);
      return [];
    }
  }

  async getTeamStats(teamId: number): Promise<TeamStats | null> {
    try {
      const response = await apiClient.get('/teams/statistics', {
        params: {
          team: teamId,
          league: 39, // Premier League by default
          season: new Date().getFullYear()
        }
      });
      return response.data.response;
    } catch (error) {
      console.error('Error fetching team stats:', error);
      return null;
    }
  }

  async getPrediction(fixtureId: number) {
    try {
      const response = await apiClient.get('/predictions', {
        params: { fixture: fixtureId }
      });
      return response.data.response[0];
    } catch (error) {
      console.error('Error fetching prediction:', error);
      return null;
    }
  }

  async getHistoricalMatches(teamId: number) {
    try {
      const response = await apiClient.get('/fixtures', {
        params: {
          team: teamId,
          last: 10
        }
      });
      return response.data.response;
    } catch (error) {
      console.error('Error fetching historical matches:', error);
      return [];
    }
  }
}

export default new SportsApiService();
