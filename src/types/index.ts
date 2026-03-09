export type Item = {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
};

export type RootStackParamList = {
  Register: undefined;
  Activation: undefined;
  Tabs: undefined;
  Details: { id: string };
};

export type TabsParamList = {
  Home: undefined;
  Settings: undefined;
};
