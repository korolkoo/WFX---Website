// wfx_stl/types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Product {
  id: number
  created_at?: string
  title: string
  description?: string | null
  price: number
  category: string
  usage: 'Prototipagem' | 'Borracha'
  
  // Mídias
  image_url: string
  file_url?: string | null    
  glb_url?: string | null    
  video_360_url?: string | null
  video_real_url?: string | null

  // Especificações Técnicas
  volume?: number | null     
  stones_info?: string | null 
  size?: string | null       
  material_config?: Json | null 
}

export interface Profile {
  id: string
  email: string
  role: 'admin' | 'user'
  created_at: string
}

export interface CartItem {
  id: number
  title: string
  price: number
  image_url: string
  file_url?: string
  quantity: number
}