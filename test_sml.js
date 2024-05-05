// 사용자 답변과 정답
const userAnswer = "시스템과 상호작용하는 시스템 또는 사람";
const correctAnswer = "대상 시스템과 상호 작용하는 사람이나 다른 시스템";

// 키워드 추출
function extractKeywords(text) {
    return text.split(''); // 단어가 아닌 한 글자씩 나눔
}

// 두 배열 간의 공통 요소 비율 계산
function calculateSimilarity(arr1, arr2) {
    const commonKeywords = arr1.filter(word => arr2.includes(word));
    return commonKeywords.length / Math.max(arr1.length, arr2.length);
}

// 키워드 추출
const userKeywords = extractKeywords(userAnswer);
const correctKeywords = extractKeywords(correctAnswer);

// 유사도 계산
const similarity = calculateSimilarity(userKeywords, correctKeywords);
console.log('유사도:', similarity);

