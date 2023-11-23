import React, {
  useContext, createContext, FC, ComponentType as CT, PropsWithChildren, useMemo,
} from 'react';

export interface Heading {
  depth: number
  slug: string
  value: string
}

export interface Entry {
  id: string
  filepath: string
  slug: string
  route: string
  name: string
  order: number
  menu: string | null
  headings: Heading[]
  [key: string]: any
}

export interface PlaygroundProps {
  // className?: string
  // style?: any
  // wrapper?: CT<any>
  // components: ComponentsMap
  component: React.ReactElement;
  // position: number
  code: string
  // scope: Record<string, any>
  // language?: string
  // showLivePreview?: boolean
  // useScoping?: boolean
}

export interface LayoutProps {
  doc: Entry
  [key: string]: any
}

export interface ComponentsMap {
  notFound?: CT
  layout?: CT<LayoutProps>
  playground?: CT<PlaygroundProps>
  [key: string]: any
}

const DefNotFound: FC = () => { return <>Not found</>; };
const DefLayout: FC<PropsWithChildren> = ({ children }) => { return children; };
const DefPlayground: FC<PlaygroundProps> = ({ component, code }) => {
  return (
    <div>
      {component}
      <pre>{code}</pre>
    </div>
  );
};

const defaultComponents: ComponentsMap = {
  layout: DefLayout,
  notFound: DefNotFound,
  playground: DefPlayground,
};

export interface ComponentsProviderProps {
  components: ComponentsMap
}

const ctx = createContext<ComponentsMap>(defaultComponents);
export const ComponentsProvider: FC<PropsWithChildren<ComponentsProviderProps>> = ({
  components: themeComponents = {},
  children,
}) => {
  const value = useMemo(() => {
    return { ...defaultComponents, ...themeComponents };
  }, [themeComponents]);
  return (
    <ctx.Provider value={value}>
      {children}
    </ctx.Provider>
  );
};

export const useComponents = (): ComponentsMap => {
  return useContext(ctx);
};
