import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sheetAPI } from '../services/api';

export const useSheets = () => {
  return useQuery({
    queryKey: ['sheets'],
    queryFn: async () => {
      const response = await sheetAPI.getAll();
      return response.data.sheets;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useSheet = (sheetId) => {
  return useQuery({
    queryKey: ['sheet', sheetId],
    queryFn: async () => {
      const response = await sheetAPI.getById(sheetId);
      return response.data.sheet;
    },
    enabled: !!sheetId,
  });
};
