// export interface News {
//     news_id: string;
//     category: string;
//     subcategory: string;
//     title: string;
//     abstract: string;
//     url: string;
// }

export interface News {
    news_id: string;
    category: string;
    subcategory: string;
    title: string;
    abstract: string;
    url: string;
    title_entities?: any;
    abstract_entities?: any;
    published_at?: string;
}