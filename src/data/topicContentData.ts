export interface LearningObjective {
  id: string;
  text: string;
}

export interface TopicResource {
  id: string;
  title: string;
  type: 'pdf' | 'video' | 'link';
  description: string;
  icon: string;
  color: string;
}

export interface TopicContentData {
  id: string;
  title: string;
  weekTitle: string;
  grade: string;
  category: string;
  duration: string;
  learningObjectives: LearningObjective[];
  introduction: string;
  sections: {
    title: string;
    content: string;
    image?: string;
    imageCaption?: string;
    quote?: string;
  }[];
  resources: TopicResource[];
  source: string;
}

export const TOPIC_CONTENT: Record<string, TopicContentData> = {
  "1-1": {
    id: "1-1",
    title: "Introduction to Organic Chemistry",
    weekTitle: "Week 7: Chemistry",
    grade: "Grade 10",
    category: "Science",
    duration: "45 mins",
    learningObjectives: [
      {
        id: "obj-1",
        text: "Define hydrocarbons and understand their primary atomic structures.",
      },
      {
        id: "obj-2",
        text: "Identify simple alkanes and alkenes in chemical equations.",
      },
      {
        id: "obj-3",
        text: "Understand the covalent bonding properties of Carbon atoms.",
      },
    ],
    introduction:
      "Organic chemistry is the study of the structure, properties, composition, reactions, and preparation of carbon-containing compounds. Most organic compounds contain carbon and hydrogen, but they may also include a number of other elements (e.g., nitrogen, oxygen, halogens, phosphorus, silicon, sulfur).",
    sections: [
      {
        title: "The Nature of Carbon",
        content:
          "Carbon is unique because it can form four covalent bonds with other atoms. This allows it to form long chains and rings, which are the backbone of organic molecules.",
        image: "https://api.builder.io/api/v1/image/assets/TEMP/835255eb72ea2fe77670ee3fc1940a40cbab26bf?width=700",
        imageCaption: "Carbon Molecular Lattice",
        quote:
          "Hydrocarbons are the simplest organic compounds, consisting entirely of carbon and hydrogen.",
      },
      {
        title: "Alkanes vs. Alkenes",
        content:
          "Alkanes are saturated hydrocarbons with single bonds between carbon atoms (C-C), following the general formula CₙH₂ₙ₊₂. Alkenes are unsaturated hydrocarbons containing at least one carbon-carbon double bond (C=C).",
      },
    ],
    resources: [
      {
        id: "res-1",
        title: "Lecture Notes: Carbon Basics",
        type: "pdf",
        description: "PDF • 2.4 MB",
        icon: "pdf",
        color: "#FEF2F2",
      },
      {
        id: "res-2",
        title: "Video: Intro to Hydrocarbons",
        type: "video",
        description: "Video • 12:05 mins",
        icon: "video",
        color: "#EFF6FF",
      },
      {
        id: "res-3",
        title: "Quiz: Check your knowledge",
        type: "link",
        description: "External Link • Google Forms",
        icon: "link",
        color: "#ECFDF5",
      },
    ],
    source: "Cambridge IGCSE Chemistry Coursebook, 4th Edition.",
  },
  "1-2": {
    id: "1-2",
    title: "Advanced Geometry Concepts",
    weekTitle: "Week 2: Mathematics",
    grade: "Grade 10",
    category: "Science",
    duration: "50 mins",
    learningObjectives: [
      {
        id: "obj-1",
        text: "Understand the properties of triangles and quadrilaterals.",
      },
      {
        id: "obj-2",
        text: "Apply the Pythagorean theorem in problem-solving.",
      },
    ],
    introduction:
      "Geometry is the branch of mathematics concerned with the properties and relations of points, lines, surfaces, and solids. In this lesson, we explore advanced geometric concepts.",
    sections: [
      {
        title: "Triangle Properties",
        content:
          "Triangles are three-sided polygons with unique properties. The sum of interior angles is always 180 degrees.",
      },
    ],
    resources: [
      {
        id: "res-1",
        title: "Practice Problems Set",
        type: "pdf",
        description: "PDF • 1.8 MB",
        icon: "pdf",
        color: "#FEF2F2",
      },
    ],
    source: "Cambridge Mathematics Coursebook.",
  },
};
