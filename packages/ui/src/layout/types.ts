export interface MenuNode {
  id: string;
  title: string;
  icon?: string;
  url: string;
  children?: MenuNode[];
}

export interface ShellAccount {
  name: string;
  username: string;
}
