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

admin_prompt = """
"""

with open("./src/testQuiz_prompt.txt", "r", encoding='utf-8') as f:
    admin_prompt = f.read()

# admin_prompt="""
#         You are a teacher teaching students at Korea. You have to make one 4-choice questions based on the keyword or text I provide you.
#         Also, You have to provide explanations with each question why this is the corrent answer.
#         Here is the example Format:
#         ------------------------------------------------------
#         Q1: First Question
#         A. First choice
#         B. second choice
#         C. third Choice
#         D. forth choice
#         Answer: correct answer(use only A~D)
#         explanation: explanation of why this is the right answer
#         --------------------------------------------------------
# """

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
        ("system", admin_prompt),#수정2
        few_shot_prompt,
        ("human", "{input}")
    ]
)

# Chat Model
model = ChatOpenAI(model="gpt-4-turbo",temperature = 0,max_tokens=1024)

# Output Parser
parser = StrOutputParser()

# Chaining
chain = final_prompt | model | parser

#오답 키워드의 내용을 입력
text = """
"""
keyword=''

# 사용자 입력 값 읽기
userInput = sys.argv[1]
# user_input = json.loads(userInput)

text = userInput

## Run the chain

made_quiz=chain.invoke({"input": text})

def parse_questions(text):
    questions = []
    #수정
    question_pattern = re.compile(r"(?:Q\d+: )?(.+?)\n+\s*A[.)]\s*(.+?)\n+\s*B[.)]\s*(.+?)\n+\s*C[.)]\s*(.+?)\n+\s*D[.)]\s*(.+?)\n+\s*Answer[):.]?\s*(.+?)\n+\s*Explanation[):.]?\s*(.+?)(?=\n+(?:Q\d+: )|$)", re.DOTALL)
    matches = question_pattern.findall(text)
    for match in matches:
        question = {
            "question": match[0],
            "options": [match[1], match[2], match[3], match[4]],
            "answer": match[5],
            "explanation": match[6]
            # "key": keyword
        }
        questions.append(question)
    return questions

quizData = parse_questions(made_quiz)
print(quizData)