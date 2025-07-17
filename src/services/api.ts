import axios from 'axios';

const API_BASE_URL = 'https://api.example.com'; // APIのベースURLを設定

// スケジュールを取得する関数
export const fetchSchedules = async () => {
  const response = await axios.get(`${API_BASE_URL}/schedules`);
  return response.data;
};

// スケジュールを作成する関数
export const createSchedule = async (scheduleData: any) => {
  const response = await axios.post(`${API_BASE_URL}/schedules`, scheduleData);
  return response.data;
};

// スケジュールを削除する関数
export const deleteSchedule = async (id: string) => {
  const response = await axios.delete(`${API_BASE_URL}/schedules/${id}`);
  return response.data;
};

// スタッフを取得する関数
export const fetchStaff = async () => {
  const response = await axios.get(`${API_BASE_URL}/staff`);
  return response.data;
};

// スタッフを作成する関数
export const createStaff = async (staffData: any) => {
  const response = await axios.post(`${API_BASE_URL}/staff`, staffData);
  return response.data;
};
