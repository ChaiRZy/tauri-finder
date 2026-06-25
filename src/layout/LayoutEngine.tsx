import type { ReactNode } from 'react';
import type { LayoutNode, LayoutContext, LayoutSplit } from './types';
import SplitPane from '../components/Layout/SplitPane';

interface Props {
  config: LayoutNode;
  context: LayoutContext;
}

export default function LayoutEngine({ config, context }: Props): ReactNode {
  return renderNode(config, context);
}

function renderNode(node: LayoutNode, ctx: LayoutContext): ReactNode {
  if (node === 'content') {
    return ctx.contentNode;
  }

  if ('plugin' in node) {
    const cmp = ctx.pluginMap[node.plugin];
    return cmp ?? null;
  }

  const split = node as LayoutSplit;
  const [first, second] = split.children;
  return (
    <SplitPane
      direction={split.direction === 'row' ? 'horizontal' : 'vertical'}
      initialSize={split.size ?? 300}
      sizeUnit={split.unit ?? 'px'}
      minSize={split.minSize ?? 80}
      maxSize={split.maxSize ?? 800}
      reverse={split.reverse ?? false}
      onSizeChange={split.onSizeChange ?? (() => {})}
    >
      {renderNode(first, ctx)}
      {renderNode(second, ctx)}
    </SplitPane>
  );
}
