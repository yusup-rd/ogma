import dynamic from "next/dynamic";

const RichTextField = dynamic(() =>
  import("../rich-text-field").then((module) => module.RichTextField),
);

export { RichTextField };
