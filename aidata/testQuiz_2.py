#!pip install -q langchain openai faiss-cpu langchainhub pypdf chromadb tiktoken

from langchain.embeddings import OpenAIEmbeddings
from langchain.prompts import FewShotPromptTemplate, PromptTemplate
from langchain.prompts.example_selector import SemanticSimilarityExampleSelector
from langchain.vectorstores import FAISS
#from langchain.llms import OpenAI
from langchain.chat_models import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser
from langchain.prompts import (
    ChatPromptTemplate,
    FewShotChatMessagePromptTemplate,
)
from langchain.document_loaders import PyPDFLoader
import csv
import re
import json
import os
import sys

from dotenv import load_dotenv
load_dotenv()  # .env 파일 로드
api_key = os.getenv("GPT_API_KEY")

os.environ["OPENAI_API_KEY"] = api_key

#few-shot 입력 방식으로 변환
#입력 파일 경로
input_file = './src/2022_1_for_test.csv'

#출력 데이터 형식
output_format = {"input": "", "output": ""}

#결과를 저장할 리스트
results = []

#CSV 파일 읽기
with open(input_file, 'r', encoding='cp949') as file:
    reader = csv.reader(file)
    next(reader) # 헤더 건너뛰기

    for row in reader:
        question = row[1]
        choices = [row[2], row[3], row[4], row[5]]
        answer = row[6]
        keyword = row[8]
        output_data = f"{question}\n A){choices[0]}\n B){choices[1]}\n C){choices[2]}\n D){choices[3]} \n Answer){answer}"
        result = output_format.copy()
        result["input"] = keyword
        result["output"] = output_data
        results.append(result)

# (a) Fixed Examples
# Define examples of creating antonyms
examples = results

# (b) A prompt template used to format each individual example.
example_prompt = ChatPromptTemplate.from_messages(
    [
        ("human", "{input}"),
        ("ai", "{output}")
    ]
)

# (c) Assemble them into the few-shot prompt template
few_shot_prompt = FewShotChatMessagePromptTemplate(
    example_prompt = example_prompt,
    examples = examples,
)

#print(few_shot_prompt.format())

# (d) Finally, assemble the final prompt and use it with a model
final_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", """
        You are a teacher teaching students at Korea. You have to make 4-choice questions based on the keyword or text I provide you.
        Also, You have to provide explanations with each question why this is the corrent answer.
        Here is the example Format:
        ------------------------------------------------------
        Q1: First Question
        A. First choice
        B. second choice
        C. third Choice
        D. forth choice
        Answer: correct answer(A~D)
        explanation: explanation of why this is the right answer
        --------------------------------------------------------
        """),
        few_shot_prompt,
        ("human", "{input}")
    ]
)

# Chat Model
model = ChatOpenAI(model="gpt-4-turbo",temperature = 0,max_tokens=4096)

# Output Parser
parser = StrOutputParser()

# Chaining
chain = final_prompt | model | parser

#오답 키워드의 내용을 입력
# text = """
# 스크럼이란 럭비에서 반칙으로 경기가 중단된 경우 양 팀 의 선수들이 럭비공을 가운데 두고 상대팀을 밀치기 위해 서로 대치해 있는 대형을 말한다. 스크럼은 이처럼 팀이 중심이 되어 개발의 효율성을 높인다는 의미가 내포된 용 어이다. • 스크럼은 팀원 스스로가 스크럼 팀을 구성(self organizing)해야 하며, 개발 작업에 관한 모든 것을 스 스로 해결(cross-functional)할 수 있어야 한다. • 스크럼 팀은 제품 책임자, 스크럼 마스터, 개발팀으로 구성된다. 제품 책임자(PO; Product Owner) • 이해관계자들 중 개발될 제품에 대한 이해도가 높고, 요구사항을 책임지고 의사 결정할 사람으로 선정하는 데, 주로 개발 의뢰자나 사용자가 담당한다. • 이해관계자들의 의견을 종합하여 제품에 대한 요구사 항을 작성하는 주체다. • 제품에 대한 테스트를 수행하면서 주기적으로 요구사 항의 우선순위를 갱신한다. 시험에 나오는 것만 공부한다! 시나공시리즈 스크럼 마스터(SM; Scrum Master) • 스크럼 팀이 스크럼을 잘 수행할 수 있도록 객관적인 시각에서 조언을 해주는 가이드 역할을 수행한다. 팀원 들을 통제하는 것이 목표가 아니다. • 일일 스크럼 회의를 주관하여 진행 사항을 점검하고, 개 발 과정에서 발생된 장애 요소를 공론화하여 처리한다. 개발팀(DT; Development Team) • 제품 책임자와 스크럼 마스터를 제외한 모든 팀원으로, 개발자 외에도 디자이너, 테스터 등 제품 개발을 위해 참여하는 모든 사람이 대상이 된다. • 보통 최대 인원은 7~8명이 적당하다
# """

# keyword="""
# 스크럼의 개요
# """

# 사용자 입력 값 읽기
userInput = sys.argv[1]
user_input = json.loads(userInput)

text = user_input["keywordMean"]
keyword = user_input["keywordName"]

## Run the chain

made_quiz=chain.invoke({"input": text})
# print(f'made_quiz: {made_quiz}')

def parse_question_string(question_string):
    # 문제, 선지, 정답, 해설을 추출
    lines = question_string.strip().split('\n')
    # for i, line in enumerate(lines):
    #     print(f'line[{i}]: {line}')
    if(len(lines) > 8):
        return lines, len(lines)
    question = lines[0]
    options = [line.strip()[3:] for line in lines[1:5]]
    answer = lines[5].split('Answer)')[1]
    explanation = lines[7].split('Explanation: ')[1]

    # JSON 형식으로 변환
    question_data = {
        "question": question,
        "options": options,
        "answer": answer,
        "explanation": explanation
    }

    return question_data

# def parse_questions(text):
#     questions = []
#     question_pattern = re.compile(r"(?:Q\d+: )?(.+?)\n+(?:A[.)] )(.+?)\n+(?:B[.)] )(.+?)\n+(?:C[.)] )(.+?)\n+(?:D[.)] )(.+?)\n+(?:Answer: )(.+?)\n+(?:Explanation: )(.+?)(?=\n+(?:Q\d+: )|$)")
#     matches = question_pattern.findall(text)
#     for match in matches:
#         question = {
#             "question": match[0],
#             "options": [match[1], match[2], match[3], match[4]],
#             "answer": match[5],
#             "explanation": match[6],
#             "key": keyword
#         }
#         questions.append(question)
#     return questions

# quizData = parse_questions(made_quiz)
quizData = parse_question_string(made_quiz)
print(quizData)
