import { inferAsyncReturnType, TRPCError } from '@trpc/server'
import { H3Event } from 'h3';
import { serverSupabaseUser } from '#supabase/server'
import { User } from '@supabase/supabase-js';
import UserAccountService, { FullDBUser } from '~~/lib/services/user.account.service';

export async function createContext(event: H3Event){
  let user: User | null = null;
  let dbUser: FullDBUser | null = null;
  
  if (!user) {
    user = await serverSupabaseUser(event);
  }
  if (!dbUser && user) {
    const userService = new UserAccountService();
    dbUser = await userService.getFullUserBySupabaseId(user.id);
    
    if (!dbUser && user) {
      dbUser = await userService.createUser(user.id, user.user_metadata.full_name?user.user_metadata.full_name:"no name supplied", user.email?user.email:"no@email.supplied" );
      console.log(`\n Created DB User \n ${JSON.stringify(dbUser)}\n`);
    }
  }

  if(!user || !dbUser) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Unable to fetch user data, please try again later. Missing ->[user:${(!user)},dbUser:${(!dbUser)}]`,
    });
  }
  
  return {
    user,
    dbUser,
  }  
};

export type Context = inferAsyncReturnType<typeof createContext>