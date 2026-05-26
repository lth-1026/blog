import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxOptions } from "@/lib/mdx-options";
import { mdxComponents } from "@/components/mdx";

export function PostBody({ content }: { content: string }) {
  return (
    <article className="prose max-w-none">
      <MDXRemote
        source={content}
        options={mdxOptions}
        components={mdxComponents}
      />
    </article>
  );
}
