export interface Parent {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
  }
  
  export interface ParentState {
    data: Parent[];
    loading: boolean;
    error: string | null;
  }
  
  // type Meal = {
  //   id: string;
  //   title: string;
  //   description: string;
  //   ingredients: string;
  //   instructions: string;
  //   nutritional_info: string;
  //   age_group: string;
  //   meal_type: string;
  //   preparation_time: number;
  //   createdAt: string;
  //   updatedAt: string;
  // };

  export interface Message {
    id: string;
    content: string;
    senderId: string;
    chatRoomId: string;
    timestamp: string;
    sender?: {
      id: string;
      name: string;
    };
  }
  
  
  // types.ts
export interface ParentInfo {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  telegram_username: string;
  avatarUrl: string;
}

export interface ParentState {
  parent: ParentInfo | null;
  user?: {
    firstName: string;
    lastName: string;
  };
}


// export type Child = {
//   id: string;
//   parent_id: string;
//   name: string;
//   date_of_birth: string;
//   gender: string;
//   weight: number;
//   height: number;
//   muac: number | null;
//   dietary_restrictions: string | null;
//   allergies: string | null;
//   medications: string | null;
//   createdAt: string;
//   updatedAt: string;
// };


// Types for Telegram WebApp user
export interface TelegramUser {
  id?: string;
  telegram_username?: string | null;
  firstName?: string;
  lastName?: string;
  gender?: string | null;
  avatarUrl?: string | null;
  address?: string | null;
  city?: string | null;
  phone?: string;
  password?: string;
  role?: 'PARENT';
  status?: string;
}

// Types for your backend user
export interface BackendUser {
  id: string;
  telegramId: string;
  firstName: string;
  lastName?: string;
  username?: string;
}