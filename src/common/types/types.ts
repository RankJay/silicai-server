export class TweetCreateEvents {
  for_user_id: string;
  tweet_create_events: Array<TweetObject>;
}

export class TweetCreateMentionEvents {
  for_user_id: string;
  user_has_blocked: boolean;
  tweet_create_events: Array<TweetObject>;
}

export class FavoriteEvents {
  for_user_id: string;
  favorite_events: Array<{
    id: string;
    created_at: Date;
    timestamp_ms: bigint;
    favorited_status: TweetObject;
    user: UserObject;
  }>;
}

export class FollowEvents {
  for_user_id: string;
  follow_events: Array<{
    type: string;
    created_timestamp: bigint;
    target: UserObject;
    source: UserObject;
  }>;
}

export class UserEvents {
  user_event: {
    revoke: {
      date_time: Date;
      target: {
        app_id: string;
      };
      source: {
        user_id: string;
      };
    };
  };
}

export class DirectMessageEvents {
  for_user_id: string;
  direct_message_events: Array<{
    type: string;
    id: string;
    created_timestamp: string;
    message_create: {
      target: {
        recipient_id: string;
      };
      sender_id: string;
      source_app_id: string;
      message_data: {
        text: string;
        entities: {
          hashtags: Array<any>;
          symbols: Array<any>;
          user_mentions: Array<any>;
          urls: Array<any>;
        };
      };
    };
  }>;
  apps: {
    (id: string): {
      id: string;
      name: string;
      url: string;
    };
    users: Record<any, any>;
    "3001969357": {
      id: "3001969357";
      created_timestamp: "1422556069340";
      name: "Jordan Brinks";
      screen_name: "furiouscamper";
      location: "Boulder; CO";
      description: "Alter Ego - Twitter PE opinions-are-my-own";
      url: "https://t.co/SnxaA15ZuY";
      protected: false;
      verified: false;
      followers_count: 22;
      friends_count: 45;
      statuses_count: 494;
      profile_image_url: "null";
      profile_image_url_https: "https://pbs.twimg.com/profile_images/851526626785480705/cW4WTi7C_normal.jpg";
    };
    "4337869213": {
      id: "4337869213";
      created_timestamp: "1448312972328";
      name: "Harrison Test";
      screen_name: "Harris_0ff";
      location: "Burlington; MA";
      protected: false;
      verified: false;
      followers_count: 8;
      friends_count: 8;
      profile_image_url: "null";
      statuses_count: 240;
      profile_image_url_https: "https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png";
    };
  };
}

export class TweetObject {
  created_at: string;
  id: number;
  id_str: string;
  text: string;
  source: string;
  truncated: boolean;
  in_reply_to_status_id: number;
  in_reply_to_status_id_str: string;
  in_reply_to_user_id: number;
  in_reply_to_user_id_str: string;
  in_reply_to_screen_name: string;
  user: UserObject;
  geo?: any;
  coordinates?: any;
  place?: any;
  contributors?: any;
  is_quote_status: boolean;
  quote_count: number;
  reply_count: number;
  retweet_count: number;
  favorite_count: number;
  entities: {
    hashtags: any[];
    urls: any[];
    user_mentions: any[];
    symbols: any[];
  };
  favorited: boolean;
  retweeted: boolean;
  edit_history: {
    initial_tweet_id: string;
    edit_tweet_ids: string[];
  };
  edit_controls: {
    editable_until_ms: number;
    edits_remaining: number;
  };
  editable: boolean;
  filter_level: string;
  lang: string;
  timestamp_ms: string;
}

export class UserObject {
  id: number;
  id_str: string;
  name: string;
  screen_name: string;
  location: string;
  url?: any;
  description: string;
  translator_type: string;
  protected: boolean;
  verified: boolean;
  verified_type: string;
  followers_count: number;
  friends_count: number;
  listed_count: number;
  favourites_count: number;
  statuses_count: number;
  created_at: string;
  utc_offset?: any;
  time_zone?: any;
  geo_enabled: boolean;
  lang?: any;
  contributors_enabled: boolean;
  is_translator: boolean;
  profile_background_color: string;
  profile_background_image_url: string;
  profile_background_image_url_https: string;
  profile_background_tile: boolean;
  profile_link_color: string;
  profile_sidebar_border_color: string;
  profile_sidebar_fill_color: string;
  profile_text_color: string;
  profile_use_background_image: boolean;
  profile_image_url: string;
  profile_image_url_https: string;
  profile_banner_url: string;
  default_profile: boolean;
  default_profile_image: boolean;
  following?: any;
  follow_request_sent?: any;
  notifications?: any;
  withheld_in_countries: any[];
}
