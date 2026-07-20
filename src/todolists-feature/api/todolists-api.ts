import axios from 'axios';
import type { Todolist } from '../types/types';
import { API_BASE_URL } from '../../constants/api/constants';

export const todolistApi = {
  getTodolists() {
    return axios
      .get<Todolist[]>(`${API_BASE_URL}/todolists`)
      .then((response) => response.data);
  },
};
