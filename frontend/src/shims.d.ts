declare module 'next/link' {
  const Link: any;
  export default Link;
}

declare module 'next/navigation' {
  export const useRouter: () => any;
  export const usePathname: () => string;
  export const useSearchParams: () => any;
  export const useParams: () => any;
  export const redirect: (url: string) => never;
}

declare module 'next/image' {
  const Image: any;
  export default Image;
}

declare module 'next' {
  export type Metadata = any;
}

declare module 'next/font/google' {
  export const Inter: any;
  export const Syne: any;
}
