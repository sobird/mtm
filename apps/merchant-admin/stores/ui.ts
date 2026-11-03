import { create } from 'zustand';

export interface UiState {
  sidebarCollapsed: boolean;
  toggleSidebar(): void;
  sidebarEditMode: boolean;
  setSidebarEditMode(value: boolean): void;
}

export const useUiStore = create<UiState>(set => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  sidebarEditMode: false,
  setSidebarEditMode: value => set({ sidebarEditMode: value }),
}));
