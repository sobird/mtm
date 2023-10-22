import React, { useContext, createContext } from 'react'
import { FC, ComponentType as CT } from 'react'


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
  className?: string
  style?: any
  wrapper?: CT<any>
  components: ComponentsMap
  component: React.ReactElement;
  position: number
  code: string
  scope: Record<string, any>
  language?: string
  showLivePreview?: boolean
  useScoping?: boolean
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

const DefNotFound: FC = () => <>Not found</>
const DefLayout: FC = ({ children }) => <>{children}</>
const DefPlayground: FC<PlaygroundProps> = ({ component, code }) => (
  <div>
    {component}
    <pre>{code}</pre>
  </div>
)

const defaultComponents: ComponentsMap = {
  layout: DefLayout,
  notFound: DefNotFound,
  playground: DefPlayground,
}

export interface ComponentsProviderProps {
  components: ComponentsMap
}

const ctx = createContext<ComponentsMap>(defaultComponents)
export const ComponentsProvider: FC<ComponentsProviderProps> = ({
  components: themeComponents = {},
  children,
}) => (
  <ctx.Provider value={{ ...defaultComponents, ...themeComponents }}>
    {children}
  </ctx.Provider>
)

export const useComponents = (): ComponentsMap => {
  return useContext(ctx)
}