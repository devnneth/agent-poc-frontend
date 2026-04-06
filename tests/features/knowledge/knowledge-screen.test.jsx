import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { KnowledgeScreen } from '../../../src/features/knowledge/screens/knowledge-screen'
import { useKnowledges, useKnowledgeSources } from '../../../src/features/knowledge/hooks/use-knowledges'
import { useToast } from '../../../src/hooks/use-toast'
import { isProductionEnvironment } from '../../../src/lib/env'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, fallbackOrOptions) => {
      if (typeof fallbackOrOptions === 'string') return fallbackOrOptions
      if (fallbackOrOptions?.defaultValue) {
        return fallbackOrOptions.defaultValue.replace('{{name}}', fallbackOrOptions.name ?? '')
      }
      return key
    },
  }),
}))

vi.mock('../../../src/features/knowledge/hooks/use-knowledges', () => ({
  useKnowledges: vi.fn(),
  useKnowledgeSources: vi.fn(),
}))

vi.mock('../../../src/hooks/use-toast', () => ({
  useToast: vi.fn(),
}))

vi.mock('../../../src/lib/env', () => ({
  isProductionEnvironment: vi.fn(),
}))

const mockToast = vi.fn()
const mockHandleCreateKnowledge = vi.fn()
const mockHandleUpdateKnowledge = vi.fn()
const mockHandleDeleteSource = vi.fn()
const mockHandleUpdateSource = vi.fn()
const unsupportedMessage = '배포 환경에서는 지식 등록, 정보 수정, 업로드, 삭제, RAG on/off 변경을 지원하지 않습니다. 관리자에게 문의해주세요.'
const retryConfirmMessage = '재시도하시겠습니까?'

describe('KnowledgeScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('confirm', vi.fn(() => true))
    isProductionEnvironment.mockReturnValue(true)

    useToast.mockReturnValue({ toast: mockToast })
    useKnowledges.mockReturnValue({
      knowledges: [
        { id: 'knowledge-1', title: '테스트 지식', description: '설명', is_rag_enabled: true },
        { id: 'knowledge-2', title: '비활성 지식', description: '숨김 설명', is_rag_enabled: false },
      ],
      handleCreateKnowledge: mockHandleCreateKnowledge,
      handleUpdateKnowledge: mockHandleUpdateKnowledge,
      loading: false,
    })
    useKnowledgeSources.mockReturnValue({
      sources: [
        {
          id: 'source-1',
          display_name: '테스트 파일.pdf',
          created_at: '2026-04-04T00:00:00.000Z',
          file_size: 2048,
          processing_status: 'DONE',
          processing_error_message: null,
          is_rag_enabled: true,
        },
        {
          id: 'source-2',
          display_name: '대기 파일.pdf',
          created_at: '2026-04-04T00:00:00.000Z',
          file_size: 1024,
          processing_status: 'PENDING',
          processing_error_message: null,
          is_rag_enabled: true,
        },
        {
          id: 'source-3',
          display_name: '오류 파일.pdf',
          created_at: '2026-04-04T00:00:00.000Z',
          file_size: 512,
          processing_status: 'ERROR',
          processing_error_message: '파싱 실패',
          is_rag_enabled: false,
        },
      ],
      handleUploadSource: vi.fn(),
      handleDeleteSource: mockHandleDeleteSource,
      handleDownloadSource: vi.fn(),
      handleUpdateSource: mockHandleUpdateSource,
      loading: false,
      isUploading: false,
      isDeleting: false,
      isDownloading: false,
      updatingSourceId: null,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('프로덕션에서는 업로드 버튼 클릭 시 안내 토스트를 띄우고 파일 선택을 막는다', () => {
    const { container } = render(<KnowledgeScreen />)

    fireEvent.click(screen.getByText('테스트 지식'))

    const fileInput = container.querySelector('input[type="file"]')
    const fileInputClickSpy = vi.spyOn(fileInput, 'click')

    fireEvent.click(screen.getByRole('button', { name: '업로드' }))

    expect(fileInputClickSpy).not.toHaveBeenCalled()
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: '지원되지 않는 기능',
      description: unsupportedMessage,
    }))
  })

  it('프로덕션에서는 삭제 버튼 클릭 시 확인창 없이 안내 토스트를 띄운다', () => {
    render(<KnowledgeScreen />)

    fireEvent.click(screen.getByText('테스트 지식'))
    fireEvent.click(screen.getByTitle('삭제'))

    expect(window.confirm).not.toHaveBeenCalled()
    expect(mockHandleDeleteSource).not.toHaveBeenCalled()
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: '지원되지 않는 기능',
      description: unsupportedMessage,
    }))
  })

  it('파일 목록 화면에서 컬렉션 활성 상태를 보여준다', () => {
    render(<KnowledgeScreen />)

    fireEvent.click(screen.getByText('테스트 지식'))

    expect(screen.getByText('컬렉션 상태')).toBeInTheDocument()
    expect(screen.getByText('활성')).toBeInTheDocument()
  })

  it('프로덕션에서는 등록 버튼 클릭 시 등록 모달 대신 안내 토스트를 띄운다', () => {
    render(<KnowledgeScreen />)

    fireEvent.click(screen.getByRole('button', { name: '등록' }))

    expect(screen.queryByText('지식 추가')).not.toBeInTheDocument()
    expect(mockHandleCreateKnowledge).not.toHaveBeenCalled()
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: '지원되지 않는 기능',
      description: unsupportedMessage,
    }))
  })

  it('컬렉션 목록에서 활성화 여부 배지가 보인다', () => {
    render(<KnowledgeScreen />)

    expect(screen.getByText('활성')).toBeInTheDocument()
    expect(screen.getByText('비활성')).toBeInTheDocument()
  })

  it('프로덕션에서는 정보수정 버튼 클릭 시 수정 모달 대신 안내 토스트를 띄운다', () => {
    render(<KnowledgeScreen />)

    fireEvent.click(screen.getByText('테스트 지식'))
    fireEvent.click(screen.getByRole('button', { name: '정보수정' }))

    expect(screen.queryByText('지식 정보 수정')).not.toBeInTheDocument()
    expect(mockHandleUpdateKnowledge).not.toHaveBeenCalled()
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: '지원되지 않는 기능',
      description: unsupportedMessage,
    }))
  })

  it('프로덕션에서는 지식 데이터 on/off 토글 시 안내 토스트를 띄운다', () => {
    render(<KnowledgeScreen />)

    fireEvent.click(screen.getByText('테스트 지식'))
    fireEvent.click(screen.getByRole('switch', { name: '테스트 파일.pdf RAG 사용 토글' }))

    expect(mockHandleUpdateSource).not.toHaveBeenCalled()
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: '지원되지 않는 기능',
      description: unsupportedMessage,
    }))
  })

  it('개발 환경에서는 컬렉션 수정 모달에서 RAG on/off를 저장할 수 있다', async () => {
    isProductionEnvironment.mockReturnValue(false)
    mockHandleUpdateKnowledge.mockResolvedValue({
      id: 'knowledge-1',
      title: '테스트 지식',
      description: '설명',
      is_rag_enabled: false,
    })

    render(<KnowledgeScreen />)

    fireEvent.click(screen.getByText('테스트 지식'))
    fireEvent.click(screen.getByRole('button', { name: '정보수정' }))
    fireEvent.click(screen.getByRole('switch', { name: '컬렉션 RAG 사용 토글' }))
    fireEvent.click(screen.getByRole('button', { name: '확인' }))

    await waitFor(() => {
      expect(mockHandleUpdateKnowledge).toHaveBeenCalledWith('knowledge-1', expect.objectContaining({
        title: '테스트 지식',
        description: '설명',
        is_rag_enabled: false,
      }))
    })
  })

  it('개발 환경에서는 지식 데이터 목록에서 개별 on/off를 변경할 수 있다', () => {
    isProductionEnvironment.mockReturnValue(false)

    render(<KnowledgeScreen />)

    fireEvent.click(screen.getByText('테스트 지식'))
    fireEvent.click(screen.getByRole('switch', { name: '테스트 파일.pdf RAG 사용 토글' }))

    expect(mockHandleUpdateSource).toHaveBeenCalledWith('source-1', {
      is_rag_enabled: false,
    })
  })

  it('DONE 이전 상태에서는 삭제와 RAG 토글이 비활성화된다', () => {
    isProductionEnvironment.mockReturnValue(false)

    render(<KnowledgeScreen />)

    fireEvent.click(screen.getByText('테스트 지식'))

    const pendingRow = screen.getByText('대기 파일.pdf').closest('tr')
    const errorRow = screen.getByText('오류 파일.pdf').closest('tr')

    expect(within(pendingRow).getByRole('switch', { name: '대기 파일.pdf RAG 사용 토글' })).toBeDisabled()
    expect(within(errorRow).getByRole('switch', { name: '오류 파일.pdf RAG 사용 토글' })).toBeDisabled()
    expect(within(pendingRow).getByTitle('완료 전에는 삭제할 수 없습니다.')).toBeDisabled()
    expect(within(errorRow).getByTitle('완료 전에는 삭제할 수 없습니다.')).toBeDisabled()
  })

  it('오류 상태 배지를 클릭하면 확인 후 PENDING으로 재시도한다', () => {
    isProductionEnvironment.mockReturnValue(false)

    render(<KnowledgeScreen />)

    fireEvent.click(screen.getByText('테스트 지식'))

    const errorRow = screen.getByText('오류 파일.pdf').closest('tr')

    fireEvent.click(within(errorRow).getByRole('button', { name: '오류' }))

    expect(window.confirm).toHaveBeenCalledWith(retryConfirmMessage)
    expect(mockHandleUpdateSource).toHaveBeenCalledWith('source-3', {
      processing_status: 'PENDING',
      processing_error_message: null,
    })
  })
})
