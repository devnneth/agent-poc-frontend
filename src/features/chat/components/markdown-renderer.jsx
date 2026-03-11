import React from 'react'
import ReactMarkdown from 'react-markdown'
import RemarkGfm from 'remark-gfm'
import RemarkBreaks from 'remark-breaks'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

// 마크다운 콘텐츠를 렌더링하는 컴포넌트
function MarkdownRenderer({ content }) {
    if (!content) return null

    return (
        <div className="prose prose-sm w-full max-w-none dark:prose-invert prose-headings:mb-3 prose-headings:mt-4 prose-p:my-2 prose-pre:bg-stone-900 prose-pre:p-0">
            <ReactMarkdown
                remarkPlugins={[RemarkGfm, RemarkBreaks]}
                components={{
                    code({ inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '')
                        return !inline && match ? (
                            <div className="overflow-hidden rounded-md">
                                <div className="bg-stone-800 px-4 py-1 text-xs text-stone-300">
                                    {match[1]}
                                </div>
                                <SyntaxHighlighter
                                    {...props}
                                    style={oneDark}
                                    language={match[1]}
                                    PreTag="div"
                                    customStyle={{ margin: 0, borderRadius: 0 }}
                                >
                                    {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                            </div>
                        ) : (
                            <code {...props} className={className}>
                                {children}
                            </code>
                        )
                    },
                    // 링크를 새 탭에서 열도록 설정
                    a: ({ ...props }) => (
                        <a
                            {...props}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium underline underline-offset-4 transition-colors hover:text-primary"
                        />
                    ),
                    // Bold 스타일 명시
                    strong: ({ ...props }) => (
                        <strong {...props} className="font-bold text-stone-900 dark:text-stone-100" />
                    ),
                    // 기본 p 태그 스타일 조정
                    p: ({ ...props }) => <p {...props} className="mb-2 leading-relaxed last:mb-0" />,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    )
}

export { MarkdownRenderer }
