#!pip install -q langchain openai faiss-cpu langchainhub pypdf chromadb tiktoken

from langchain.embeddings import OpenAIEmbeddings
from langchain.prompts import FewShotPromptTemplate, PromptTemplate
from langchain.prompts.example_selector import SemanticSimilarityExampleSelector
from langchain.vectorstores import FAISS
from langchain.chat_models import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser
from langchain.prompts import (
    ChatPromptTemplate,
    FewShotChatMessagePromptTemplate,
)
import csv
import re
import os
import json
import sys

from dotenv import load_dotenv
load_dotenv()  # .env 파일 로드
api_key = os.getenv("GPT_API_KEY")

os.environ["OPENAI_API_KEY"] = api_key

#few-shot 입력 방식으로 변환
#입력 파일 경로
input_file = './src/2022_1_for_test.csv' #내가 보낸 문제파일 경로 입력

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
        ("system", "You are a teacher teaching students at Korea. You have to make 5 4-choice questions based on the keyword or text I provide you. The quiz must start with the quiz number like Q1 "),
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

# 사용자 입력 값 읽기
userInput = sys.argv[1]
user_input = json.loads(userInput)

#오답 키워드의 내용을 입력
# text = ["""
# 객체지향
# """]
text = userInput

## Run the chain

made_quiz=chain.invoke({"input": text})

def convert_to_dict(problem_set):
    problems = []
    current_problem = []
    for line in problem_set.strip().split("\n"):
        line = line.strip()
        if line.startswith("Q") or re.match(r'^[^A-D\[\]]+\?$', line):  # 문제 시작 조건
            if current_problem:
                problems.append(parse_problem(current_problem))
            current_problem = []
        current_problem.append(line)
    if current_problem:
        problems.append(parse_problem(current_problem))
    return problems

def parse_problem(lines):
    if lines[0].startswith("Q"):
        question_line = lines[0]
        question_num, question_text = question_line.split(":")[0], ":".join(question_line.split(":")[1:]).strip()
    else:
        question_num = None
        question_text = lines[0]
    options = []
    answer = None
    for line in lines[1:]:
        line = line.strip()
        if line.startswith("A)"or"A."):
            options.append(line[2:].strip())
        elif line.startswith("B)"or"B."):
            options.append(line[2:].strip())
        elif line.startswith("C)"or"C."):
            options.append(line[2:].strip())
        elif line.startswith("D)"or"D."):
            options.append(line[2:].strip())
        elif line.startswith("Answer)"or"Answer."or"answer"or"Answer"):
            answer = line[7:].strip()
    if question_num:
        question = f"{question_num}: {question_text}"
    else:
        question = question_text
    return {
        "question": question,
        "options": options,
        "answer": answer
    }

results = convert_to_dict(made_quiz)
print(",\n".join([str(problem) for problem in results]))
