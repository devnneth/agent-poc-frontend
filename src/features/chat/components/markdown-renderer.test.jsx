import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MarkdownRenderer } from './markdown-renderer'

describe('MarkdownRenderer', () => {
    it('renders markdown content correctly', () => {
        const content = '# Hello\n\n- Item 1\n- Item 2\n\n**Bold Text**'
        render(<MarkdownRenderer content={content} />)

        // 헤딩 확인 (h1 태그)
        const heading = screen.getByRole('heading', { level: 1 })
        expect(heading).toHaveTextContent('Hello')

        // 리스트 확인
        const listItems = screen.getAllByRole('listitem')
        expect(listItems).toHaveLength(2)
        expect(listItems[0]).toHaveTextContent('Item 1')
        expect(listItems[1]).toHaveTextContent('Item 2')

        // 굵은 글씨 확인 (strong 태그) 및 스타일 확인
        const boldText = screen.getByText('Bold Text')
        expect(boldText.tagName).toBe('STRONG')
        expect(boldText).toHaveClass('font-bold')
    })

    it('renders links with target="_blank"', () => {
        const content = '[Link](https://example.com)'
        render(<MarkdownRenderer content={content} />)

        const link = screen.getByRole('link', { name: 'Link' })
        expect(link).toBeInTheDocument()
        expect(link).toHaveAttribute('href', 'https://example.com')
        expect(link).toHaveAttribute('target', '_blank')
        expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('renders code blocks', () => {
        const content = '```javascript\nconsole.log("test")\n```'
        render(<MarkdownRenderer content={content} />)

        // 언어 라벨이 렌더링되었는지 확인 (커스텀 렌더러가 언어를 표시함)
        expect(screen.getByText('javascript')).toBeInTheDocument()
    })

    it('renders hard breaks (newlines) as <br>', () => {
        const content = 'First line\nSecond line'
        const { container } = render(<MarkdownRenderer content={content} />)

        // remark-breaks가 적용되면 줄바꿈이 <br> 태그로 변환되어야 함
        expect(container.querySelector('br')).toBeInTheDocument()
    })
})
