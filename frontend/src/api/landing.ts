import { apiClient } from "./client";

export interface LandingSlide {
  id: number;
  imageUrl: string;
  caption?: string | null;
  sortOrder: number;
  active: boolean;
}

export interface LandingContent {
  eyebrow: string;
  headline: string;
  subheadline: string;
  slides: LandingSlide[];
}

export interface LandingSlideRequest {
  imageUrl: string;
  caption?: string;
  sortOrder?: number;
  active?: boolean;
}

export async function getPublicLanding(): Promise<LandingContent> {
  const { data } = await apiClient.get<LandingContent>("/public/landing");
  return data;
}

export async function listLandingSlides(): Promise<LandingSlide[]> {
  const { data } = await apiClient.get<LandingSlide[]>("/landing-slides");
  return data;
}

export async function createLandingSlide(request: LandingSlideRequest): Promise<LandingSlide> {
  const { data } = await apiClient.post<LandingSlide>("/landing-slides", request);
  return data;
}

export async function updateLandingSlide(id: number, request: LandingSlideRequest): Promise<LandingSlide> {
  const { data } = await apiClient.put<LandingSlide>(`/landing-slides/${id}`, request);
  return data;
}

export async function deleteLandingSlide(id: number): Promise<void> {
  await apiClient.delete(`/landing-slides/${id}`);
}
