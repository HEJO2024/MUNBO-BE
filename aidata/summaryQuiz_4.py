#!pip install openai==0.28
#!pip install langchain
#!pip install fuzzywuzzy
import json
import sys

import os
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain.llms import OpenAI
from fuzzywuzzy import fuzz
import re
from dotenv import load_dotenv
from langchain.callbacks import get_openai_callback


load_dotenv()  # .env 파일 로드
api_key = os.getenv("GPT_API_KEY")

# 사용자 입력 값 읽기
userInput = sys.argv[1]
user_input = json.loads(userInput)

os.environ['OPENAI_API_KEY'] = api_key

객관식 = '''

4-choice (sentence or short words options).
Format is
Q1: {question}
A. {option_a}
B. {option_b}
C. {option_c}
D. {option_d}
Answer: {correct_answer}

'''
주관식 = '''

subjective question(sentence or short words options)
Format is
Q1: {question}
Answer: {correct_answer}

'''
OX = '''

OX Quiz that Can only be answered with correct(O) or incorrect(X)
Format is
Q1: {question}
Answer: {correct_answer}

'''
token_usage=0

# 객체 생성
llm = OpenAI(temperature=0, max_tokens=4096, model_name='gpt-4-turbo')

# 질문 템플릿 형식
prompt_template = """
You are a teacher. You are teaching a class of students.
Make just only {num} {type} of test questions for the following text.
use {language} as this test language.
If I have any additional requests when creating this test, you have to use them to create problems.
Additional request is your top priority when making questions.
----------------
Additional requests:{requests}
----------------
TEXT: {text}
"""
prompt = PromptTemplate(template=prompt_template, input_variables=['num', 'type','language','requests','text'])

# 문제 생성 변수 생성

textbook_content = user_input["text"]
lan_v = user_input["Q_language"]
num_v = user_input["quizNum"]
requests = user_input["userRequirements"]
quiz_type = user_input["quizType"]

if quiz_type == 0:
    type_v = 객관식
elif quiz_type == 1:
    type_v = 주관식
else:
    type_v = OX

# 답변 생성
llm_chain = LLMChain(prompt=prompt, llm=llm)

with get_openai_callback() as cb:
    result = llm_chain.run(num=num_v, type=type_v, language=lan_v, requests=requests, text=textbook_content)
    token_usage=cb.total_tokens
    
#객관식 형식 변경 함수
def convert_to_js_objects_1(text):
    pattern = r'(Q\d+:\s*.*?)\n((?:(?:[A-D]\.\s*.*?)\n?)*)\n(Answer:\s*[A-D])'
    matches = re.findall(pattern, text, re.DOTALL)
    
    js_objects = []
    for match in matches:
        question = match[0]
        options = [option.strip() for option in re.split(r'(?:[A-D]\.\s*)', match[1].strip()) if option.strip()]
        answer = match[2].split(':')[1].strip()
        
        js_object = f"""{{
    question: "{question}",
    options: [{', '.join([f'"{option}"' for option in options])}],
    answer: "{answer}"
}}"""
        
        js_objects.append(js_object)
    
    return ', '.join(js_objects)

if type_v == 객관식:
    js_objects = convert_to_js_objects_1(result)
    if js_objects:
        print(js_objects)
    else:
        print("데이터 형식이 잘못되었습니다.")

else:
    questions = []
    answers = []
    json_data = []

    # 주어진 내용을 줄 단위로 분할하여 처리
    for line in result.split('\n'):
        if line.strip():  # 빈 줄이 아닌 경우에만 처리
            if line.startswith("Answer:"):  # 답변을 의미하는 경우
                answers.append(line.split(":")[1].strip())  # 답 추가
            else:  # 문제를 의미하는 경우
                questions.append(line.strip())  # 문제 추가

    # 결과 출력
    for i, (question, answer) in enumerate(zip(questions, answers), start=1):
        data = {"question": question, "answer": answer}
        json_data.append(data)

    json_string = json.dumps(json_data, ensure_ascii=False)
    print(json_string)
    print(token_usage)
